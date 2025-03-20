// ProductionHistoryController.cs
using NovusDashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace NovusDashboard.Controllers
{
    public class ProductionHistoryController : Controller
    {
        private readonly MongoDBService _mongoDBService;
        private readonly CollectionService _collectionService;
        private readonly string _collectionName = "test_models";

        public ProductionHistoryController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            _collectionService = new CollectionService(mongoDBService, _collectionName);
        }

        public IActionResult Index()
        {
            var data = _collectionService.GetPagedJobData(new[] { "Name", "Duration" }, 1, 5);
            return Json(data);
        }

        public IActionResult GetTotalCount()
        {
            return Json(_collectionService.GetTotalJobCount());
        }

        public IActionResult GetPageData(int page, int rowsPerPage, [FromQuery] string[] columns)
        {
            if (page < 1) page = 1;
            if (rowsPerPage < 1) rowsPerPage = 5;
            if (columns == null || columns.Length == 0) columns = new[] { "Name", "Duration" };
            var data = _collectionService.GetPagedJobData(columns, page, rowsPerPage);
            return Json(data);
        }

        public IActionResult GetRangeJobData([FromQuery] string[] columns, int startIndex, int count)
        {
            var rangeData = _collectionService.GetRangeJobData(columns, startIndex, count);
            return Json(rangeData);
        }

        public IActionResult GetColumnData(string column, int startIndex, int count)
        {
            if (string.IsNullOrEmpty(column))
            {
                return BadRequest("Column name is required");
            }

            var columns = new[] { column };
            var columnData = _collectionService.GetRangeJobData(columns, startIndex, count);
            return Json(columnData);
        }

        public IActionResult HandleRowCountChange(int currentPage, int currentRowCount,
            int rowCountChange, [FromQuery] string[] columns)
        {
            if (currentPage < 1) currentPage = 1;
            if (columns == null || columns.Length == 0) columns = new[] { "Name", "Duration" };
            var additionalData = _collectionService.HandleRowCountChange(
                currentPage, currentRowCount, rowCountChange, columns);
            return Json(additionalData);
        }

        // Search endpoints

        [HttpGet]
        public IActionResult Search(string term, string type, int page, int rowsPerPage, [FromQuery] string[] columns)
        {
            if (string.IsNullOrEmpty(term) || string.IsNullOrEmpty(type))
            {
                return BadRequest("Search term and type are required");
            }

            if (page < 1) page = 1;
            if (rowsPerPage < 1) rowsPerPage = 5;
            if (columns == null || columns.Length == 0) columns = new[] { "Name", "Duration" };

            var searchResults = _collectionService.SearchData(term, type, columns, page, rowsPerPage);
            return Json(searchResults);
        }

        [HttpGet]
        public IActionResult SearchRange(string term, string type, int startIndex, int count, [FromQuery] string[] columns)
        {
            if (string.IsNullOrEmpty(term) || string.IsNullOrEmpty(type))
            {
                return BadRequest("Search term and type are required");
            }

            if (columns == null || columns.Length == 0) columns = new[] { "Name", "Duration" };

            var searchResults = _collectionService.SearchRangeData(term, type, columns, startIndex, count);
            return Json(searchResults);
        }

        [HttpGet]
        public IActionResult SearchCount(string term, string type)
        {
            if (string.IsNullOrEmpty(term) || string.IsNullOrEmpty(type))
            {
                return BadRequest("Search term and type are required");
            }

            var count = _collectionService.SearchCount(term, type);
            return Json(count);
        }
    }
}