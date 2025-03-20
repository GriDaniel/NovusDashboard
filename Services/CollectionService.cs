// CollectionService.cs
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace NovusDashboard.Services
{
    public class CollectionService
    {
        private readonly MongoDBService _mongoDBService;
        private readonly string _collectionName;

        public CollectionService(MongoDBService mongoDBService, string collectionName = "test_models")
        {
            _mongoDBService = mongoDBService;
            _collectionName = collectionName;
        }

        public BsonDocument CreateColumnProjection(string[] displayColumns)
        {
            var projection = new BsonDocument();
            projection.Add("_id", 0);

            foreach (var displayColumn in displayColumns)
            {
                // Handle special cases with mappings
                switch (displayColumn)
                {
                    case "Profile Name":
                        projection.Add("profile", 1);  // Include the whole profile object
                        break;
                    default:
                        // For regular columns, just add them as is
                        projection.Add(displayColumn, 1);
                        break;
                }
            }

            return projection;
        }

        // Get total count using aggregation
        public int GetTotalJobCount()
        {
            var countPipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$count", "total")
            };

            var result = _mongoDBService.ExecuteAggregation(_collectionName, countPipeline);
            return result.Any() ? result.First()["total"].AsInt32 : 0;
        }

        // Get paged data using aggregation
        public List<Dictionary<string, object>> GetPagedJobData(string[] columns, int pageNumber, int rowsPerPage)
        {
            // Use the mapping function instead of direct projection creation
            var projection = CreateColumnProjection(columns);

            // Create pipeline
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$job_list")),
                new BsonDocument("$project", projection),
                new BsonDocument("$skip", (pageNumber - 1) * rowsPerPage),
                new BsonDocument("$limit", rowsPerPage)
            };

            // Execute and convert results
            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Get range of data using aggregation
        public List<Dictionary<string, object>> GetRangeJobData(string[] columns, int startIndex, int count)
        {
            // Use the mapping function
            var projection = CreateColumnProjection(columns);

            // Create pipeline
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$job_list")),
                new BsonDocument("$project", projection),
                new BsonDocument("$skip", startIndex),
                new BsonDocument("$limit", count)
            };

            // Execute and convert results
            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Handle row count change using aggregation
        public List<Dictionary<string, object>> HandleRowCountChange(int currentPage, int currentRowsPerPage,
            int rowCountChange, string[] columns)
        {
            if (rowCountChange <= 0)
                return new List<Dictionary<string, object>>();

            int additionalStartIndex = (currentPage - 1) * currentRowsPerPage + currentRowsPerPage;
            return GetRangeJobData(columns, additionalStartIndex, rowCountChange);
        }

        // Search methods

        // Create a match stage for search query
        private BsonDocument CreateSearchMatchStage(string term, string type)
        {
            // Handle "Profile Name" special case
            BsonDocument matchField;
            if (type == "Profile Name")
            {
                // Create a match for the nested profile.name field
                matchField = new BsonDocument("profile.name",
                    new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i")));
            }
            else
            {
                // Create a match for the regular field
                matchField = new BsonDocument(type,
                    new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i")));
            }

            return new BsonDocument("$match", matchField);
        }

        // Search data with pagination
        public List<Dictionary<string, object>> SearchData(string term, string type, string[] columns, int page, int rowsPerPage)
        {
            // Use the mapping function
            var projection = CreateColumnProjection(columns);

            // Create match stage for search
            var matchStage = CreateSearchMatchStage(term, type);

            // Create pipeline
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$job_list")),
                matchStage,
                new BsonDocument("$project", projection),
                new BsonDocument("$skip", (page - 1) * rowsPerPage),
                new BsonDocument("$limit", rowsPerPage)
            };

            // Execute and convert results
            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Search data with range
        public List<Dictionary<string, object>> SearchRangeData(string term, string type, string[] columns, int startIndex, int count)
        {
            // Use the mapping function
            var projection = CreateColumnProjection(columns);

            // Create match stage for search
            var matchStage = CreateSearchMatchStage(term, type);

            // Create pipeline
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$job_list")),
                matchStage,
                new BsonDocument("$project", projection),
                new BsonDocument("$skip", startIndex),
                new BsonDocument("$limit", count)
            };

            // Execute and convert results
            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Get count of search results
        public int SearchCount(string term, string type)
        {
            // Create match stage for search
            var matchStage = CreateSearchMatchStage(term, type);

            // Create pipeline
            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$job_list"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$job_list")),
                matchStage,
                new BsonDocument("$count", "total")
            };

            // Execute and get count
            var result = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return result.Any() ? result.First()["total"].AsInt32 : 0;
        }
    }

    // Extension method for BsonDocument conversion
    public static class BsonExtensions
    {
        public static Dictionary<string, object> ToDictionary(this BsonDocument doc)
        {
            return doc.Elements.ToDictionary(
                element => element.Name,
                element => BsonValueToObject(element.Value)
            );
        }

        private static object BsonValueToObject(BsonValue value)
        {
            if (value.IsString) return value.AsString;
            if (value.IsInt32) return value.AsInt32;
            if (value.IsInt64) return value.AsInt64;
            if (value.IsDouble) return value.AsDouble;
            if (value.IsBoolean) return value.AsBoolean;
            if (value.IsBsonDocument) return ((BsonDocument)value).ToDictionary();

            return value.ToString();
        }
    }
}