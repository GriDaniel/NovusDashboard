// Services/TableStateService.cs
using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using NovusDashboard.Models;

namespace NovusDashboard.Services
{
    public class TableStateService
    {
        private readonly string _statePath;
        private readonly SemaphoreSlim _lock = new SemaphoreSlim(1, 1);
        private TableStateModel _cachedState = null;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = false
        };
        private readonly ILogger<TableStateService> _logger;
        private readonly IConfiguration _configuration;

        public TableStateService(ILogger<TableStateService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            // Try to get the path from configuration
            string configuredPath = _configuration["TableState:StoragePath"];

            if (!string.IsNullOrEmpty(configuredPath))
            {
                // Use configured path
                _statePath = EnsureDirectoryExists(configuredPath);
                _logger.LogInformation("Using configured storage path: {Path}", _statePath);
            }
            else
            {
                // Fallback 1: Use App_Data folder
                string appDataPath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data");
                string appDataStatePath = Path.Combine(appDataPath, "table-state.json");

                if (CanAccessDirectory(appDataPath))
                {
                    _statePath = appDataStatePath;
                    _logger.LogInformation("Using App_Data storage path: {Path}", _statePath);
                }
                else
                {
                    // Fallback 2: Use ContentRootPath 
                    string contentRootPath = Directory.GetCurrentDirectory();
                    string contentStatePath = Path.Combine(contentRootPath, "table-state.json");

                    _statePath = contentStatePath;
                    _logger.LogInformation("Using content root storage path: {Path}", _statePath);
                }
            }
        }

        private string EnsureDirectoryExists(string filePath)
        {
            string directory = Path.GetDirectoryName(filePath);
            if (!Directory.Exists(directory))
            {
                try
                {
                    Directory.CreateDirectory(directory);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create directory: {Directory}", directory);
                    // Fallback to current directory if we can't create the specified one
                    return Path.Combine(Directory.GetCurrentDirectory(), "table-state.json");
                }
            }
            return filePath;
        }

        private bool CanAccessDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                try
                {
                    Directory.CreateDirectory(path);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Cannot create directory: {Path}", path);
                    return false;
                }
            }

            try
            {
                string testFile = Path.Combine(path, "test.tmp");
                File.WriteAllText(testFile, "test");
                File.Delete(testFile);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cannot write to directory: {Path}", path);
                return false;
            }
        }

        // Load full state
        public async Task<TableStateModel> GetStateAsync()
        {
            try
            {
                if (_cachedState != null) return _cachedState;

                if (!File.Exists(_statePath))
                {
                    _logger.LogInformation("State file does not exist. Creating new state.");
                    return new TableStateModel();
                }

                await _lock.WaitAsync();
                try
                {
                    string json = await File.ReadAllTextAsync(_statePath);
                    var state = JsonSerializer.Deserialize<TableStateModel>(json, _jsonOptions);
                    return _cachedState = state ?? new TableStateModel();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error reading state file: {Path}", _statePath);
                    return new TableStateModel();
                }
                finally
                {
                    _lock.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetStateAsync");
                return new TableStateModel();
            }
        }

        // Save full state
        public async Task SaveStateAsync(TableStateModel state)
        {
            try
            {
                state.ValidateAndTrim();

                await _lock.WaitAsync();
                try
                {
                    string json = JsonSerializer.Serialize(state, _jsonOptions);
                    await File.WriteAllTextAsync(_statePath, json);
                    _cachedState = state;
                    _logger.LogInformation("State saved successfully to {Path}", _statePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving state to file: {Path}", _statePath);
                    throw;
                }
                finally
                {
                    _lock.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SaveStateAsync");
                throw;
            }
        }

        // Load expanded state
        public async Task<bool> IsExpandedAsync()
        {
            var state = await GetStateAsync();
            return state.IsExpanded;
        }

        // Update expanded state
        public async Task SetExpandedAsync(bool expanded)
        {
            var state = await GetStateAsync();
            state.IsExpanded = expanded;
            await SaveStateAsync(state);
        }

        // Update dimensions
        public async Task UpdateDimensionsAsync(int rowCount, int colCount)
        {
            var state = await GetStateAsync();
            state.RowCount = rowCount;
            state.ColCount = colCount;
            await SaveStateAsync(state);
        }

        // Update all column titles
        public async Task UpdateColumnTitlesAsync(List<string> titles)
        {
            var state = await GetStateAsync();
            state.ColumnTitles = titles;
            await SaveStateAsync(state);
        }

        // Delete column title by index
        public async Task DeleteColumnTitleAsync(int index)
        {
            var state = await GetStateAsync();
            if (index >= 0 && index < state.ColumnTitles.Count)
            {
                state.ColumnTitles.RemoveAt(index);
                await SaveStateAsync(state);
            }
        }

        // Swap column titles
        public async Task SwapColumnTitlesAsync(int index1, int index2)
        {
            var state = await GetStateAsync();
            if (index1 >= 0 && index1 < state.ColumnTitles.Count &&
                index2 >= 0 && index2 < state.ColumnTitles.Count)
            {
                string temp = state.ColumnTitles[index1];
                state.ColumnTitles[index1] = state.ColumnTitles[index2];
                state.ColumnTitles[index2] = temp;
                await SaveStateAsync(state);
            }
        }
    }
}