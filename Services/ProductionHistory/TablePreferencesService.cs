using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using NovusDashboard.Models;

namespace NovusDashboard.Services.ProductionHistory
{
    public class TablePreferencesService
    {
        private readonly string _prefsPath;
        private readonly SemaphoreSlim _lock = new SemaphoreSlim(1, 1);
        private TablePreferencesModel _cachedPrefs = null;
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions { WriteIndented = false };
        private readonly ILogger<TablePreferencesService> _logger;

        public TablePreferencesService(ILogger<TablePreferencesService> logger, IConfiguration configuration)
        {
            _logger = logger;

            // Use App_Data folder by default
            string appDataPath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data");
            _prefsPath = Path.Combine(appDataPath, "table-preferences.json");

            // Ensure directory exists
            if (!Directory.Exists(appDataPath))
            {
                try
                {
                    Directory.CreateDirectory(appDataPath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create App_Data directory. Using current directory.");
                    _prefsPath = Path.Combine(Directory.GetCurrentDirectory(), "table-preferences.json");
                }
            }
        }

        public async Task<TablePreferencesModel> GetPreferencesAsync()
        {
            try
            {
                if (_cachedPrefs != null) return _cachedPrefs;

                if (!File.Exists(_prefsPath))
                {
                    _logger.LogInformation("Preferences file does not exist. Creating defaults.");
                    return new TablePreferencesModel();
                }

                await _lock.WaitAsync();
                try
                {
                    string json = await File.ReadAllTextAsync(_prefsPath);
                    var prefs = JsonSerializer.Deserialize<TablePreferencesModel>(json, _jsonOptions);
                    return _cachedPrefs = prefs ?? new TablePreferencesModel();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error reading preferences file: {Path}", _prefsPath);
                    return new TablePreferencesModel();
                }
                finally
                {
                    _lock.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPreferencesAsync");
                return new TablePreferencesModel();
            }
        }

        public async Task SavePreferencesAsync(TablePreferencesModel prefs)
        {
            try
            {
                prefs.ValidateAndTrim();

                await _lock.WaitAsync();
                try
                {
                    string json = JsonSerializer.Serialize(prefs, _jsonOptions);
                    await File.WriteAllTextAsync(_prefsPath, json);
                    _cachedPrefs = prefs;
                    _logger.LogInformation("Preferences saved successfully to {Path}", _prefsPath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving preferences to file: {Path}", _prefsPath);
                }
                finally
                {
                    _lock.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SavePreferencesAsync");
            }
        }

        public async Task UpdateColumnTitlesAsync(List<string> titles)
        {
            var prefs = await GetPreferencesAsync();
            prefs.ColumnTitles = titles;
            await SavePreferencesAsync(prefs);
        }

        public async Task UpdateRowCountAsync(int rowCount)
        {
            var prefs = await GetPreferencesAsync();
            prefs.RowCount = rowCount;
            await SavePreferencesAsync(prefs);
        }
    }
}