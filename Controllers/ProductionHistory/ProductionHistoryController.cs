// ProductionHistoryController.cs with unified data retrieval endpoints
using NovusDashboard.Services;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;

namespace NovusDashboard.Controllers.ProductionHistory
{
    public class ProductionHistoryController : Controller
    {
        private readonly MongoDBService _mongoDBService;
        private readonly CollectionService _collectionService;
        private readonly string _collectionName = "test_models";
        private readonly ILogger<ProductionHistoryController> _logger;
        private readonly BundleManagerService _bundleManager;

        public IActionResult Home()
        {
            ViewBag.BundlesLoaded = _bundleManager.VerifyAllBundlesExist();
            return View();
        }

        public ProductionHistoryController(MongoDBService mongoDBService, ILogger<ProductionHistoryController> logger, BundleManagerService bundleManager)
        {
            _mongoDBService = mongoDBService;
            _collectionService = new CollectionService(mongoDBService, _collectionName);
            _logger = logger;
            _bundleManager = bundleManager;
        }

        // UNIFIED ENDPOINTS

        /// <summary>
        /// Unified endpoint for data retrieval with filtering, sorting, and pagination
        /// </summary>
        public IActionResult GetData(
            int startIndex,
            int count,
            [FromQuery] string[] columns,
            string searchTerm = null,
            string searchType = null,
            string sortColumn = null,
            string sortDirection = null)
        {
            Stopwatch sw = Stopwatch.StartNew();

            // Validate and set defaults
            if (startIndex < 0) startIndex = 0;
            if (count < 1) count = 10;
            if (columns == null || columns.Length == 0) columns = new[] { "Name", "Duration" };

            // Convert sort direction to int
            int? sortOrder = null;
            if (!string.IsNullOrEmpty(sortColumn) && !string.IsNullOrEmpty(sortDirection))
            {
                sortOrder = sortDirection.ToLower() == "up" || sortDirection.ToLower() == "asc" ? 1 : -1;
            }

            _logger.LogInformation("Unified data retrieval: StartIndex {StartIndex}, Count {Count}, " +
                                  "Search {SearchTerm}/{SearchType}, Sort {SortColumn}/{SortDirection}",
                                  startIndex, count, searchTerm, searchType, sortColumn, sortDirection);

            var dataFetchSw = Stopwatch.StartNew();
            var data = _collectionService.GetData(columns, startIndex, count, searchTerm, searchType, sortColumn, sortOrder);
            dataFetchSw.Stop();

            sw.Stop();
            LogPerformanceMetrics(
                "GetData",
                sw.ElapsedMilliseconds,
                data,
                new Dictionary<string, object> {
                    { "DataFetchTime", dataFetchSw.ElapsedMilliseconds },
                    { "StartIndex", startIndex },
                    { "Count", count },
                    { "SearchTerm", searchTerm },
                    { "SearchType", searchType },
                    { "SortColumn", sortColumn },
                    { "SortDirection", sortDirection },
                    { "ColumnCount", columns.Length }
                });

            return Json(data);
        }

        /// <summary>
        /// Unified endpoint for getting count with optional filtering
        /// </summary>
        public IActionResult GetCount(string searchTerm = null, string searchType = null)
        {
            Stopwatch sw = Stopwatch.StartNew();

            _logger.LogInformation("Unified count: Search {SearchTerm}/{SearchType}",
                                  searchTerm, searchType);

            var dataFetchSw = Stopwatch.StartNew();
            var count = _collectionService.GetCount(searchTerm, searchType);
            dataFetchSw.Stop();

            sw.Stop();
            _logger.LogInformation("Count operation completed in {ElapsedMs}ms. Count: {Count}",
                                  sw.ElapsedMilliseconds, count);

            if (sw.ElapsedMilliseconds > 200)
            {
                _logger.LogWarning("⚠️ Slow count operation detected ({ElapsedMs}ms)",
                                  sw.ElapsedMilliseconds);
            }

            return Json(count);
        }

        // Helper method for logging performance metrics (unchanged)
        private void LogPerformanceMetrics(string operation, long elapsedMs, ICollection<Dictionary<string, object>> data, Dictionary<string, object> additionalInfo = null)
        {
            // Calculate data size (approximate)
            string jsonData = JsonSerializer.Serialize(data);
            int dataSizeBytes = System.Text.Encoding.UTF8.GetByteCount(jsonData);
            int dataSizeKB = dataSizeBytes / 1024;

            // Build log message
            string logMessage = $"{operation} completed in {elapsedMs}ms. Retrieved {data.Count} rows, data size: {dataSizeKB}KB";

            // Log at appropriate level based on response time
            if (elapsedMs > 500)
            {
                _logger.LogWarning("⚠️ SLOW OPERATION: " + logMessage);
            }
            else if (elapsedMs > 200)
            {
                _logger.LogInformation("⚠️ " + logMessage);
            }
            else
            {
                _logger.LogInformation(logMessage);
            }
            // Log additional metrics
            if (additionalInfo != null)
            {
                var metricsJson = JsonSerializer.Serialize(additionalInfo);
                _logger.LogDebug("Performance metrics for {Operation}: {Metrics}", operation, metricsJson);
            }
        }
    }
}