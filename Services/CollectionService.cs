using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace NovusDashboard.Services
{
    public class CollectionService
    {
        private readonly MongoDBService _mongoDBService;
        private readonly string _collectionName;
        private readonly Dictionary<string, string> _fieldMappings;

        public CollectionService(MongoDBService mongoDBService, string collectionName = "test_models")
        {
            _mongoDBService = mongoDBService;
            _collectionName = collectionName;

                    // Initialize comprehensive field mappings
                    _fieldMappings = new Dictionary<string, string>
        {
            // Explicitly map both Name fields
            { "Name", "Name" },                    // Job.Name - explicitly defined
            { "Profile Name", "Profile.Name" },    // Profile.Name
    
            // Other mappings
            { "File Path", "FilePath" },
            { "Front-cut Off Distance", "FrontCutOffDistance" },
            { "Cut-off Length", "CutOffLength" },
            { "Square-up Distance", "SquareUpDistance" }
        };
        }

        public BsonDocument CreateColumnProjection(string[] displayColumns)
        {
            // Create projection that uses direct field mapping instead of inclusion/exclusion
            var projectionDoc = new BsonDocument();

            // First set all fields to 0 to exclude them by default (excluding _id)
            projectionDoc.Add("_id", 0);

            // Track fields that have been added to avoid duplicates
            HashSet<string> addedFields = new HashSet<string>();

            // For each display column, map to the appropriate field expression
            foreach (var displayColumn in displayColumns)
            {
                if (_fieldMappings.TryGetValue(displayColumn, out string mappedField))
                {
                    // Skip if we've already added this field
                    if (addedFields.Contains(displayColumn))
                        continue;

                    // Add this field to our tracking set
                    addedFields.Add(displayColumn);

                    // Handle nested fields by using the $ prefix notation for expressions
                    if (mappedField.Contains('.'))
                    {
                        // Create direct reference to the nested field using MongoDB's $ notation
                        projectionDoc.Add(displayColumn, new BsonDocument("$ifNull",
                            new BsonArray { $"${mappedField}", BsonNull.Value }));

                        Console.WriteLine($"Creating direct mapping for nested field: {mappedField} -> {displayColumn}");
                    }
                    else
                    {
                        // For direct mappings, create a renamed field
                        projectionDoc.Add(displayColumn, new BsonDocument("$ifNull",
                            new BsonArray { $"${mappedField}", BsonNull.Value }));

                        Console.WriteLine($"Creating direct mapping for field: {mappedField} -> {displayColumn}");
                    }
                }
                else
                {
                    // No mapping found, use the column name as is
                    projectionDoc.Add(displayColumn, new BsonDocument("$ifNull",
                        new BsonArray { $"${displayColumn}", BsonNull.Value }));

                    Console.WriteLine($"Using direct column name: {displayColumn}");
                }
            }

            // Debug log the final projection
            Console.WriteLine($"Final projection: {projectionDoc.ToJson()}");
            return projectionDoc;
        }

        // Get total count using aggregation
        public int GetTotalJobCount()
        {
            var countPipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$Jobs"),  
                new BsonDocument("$count", "total")
            };

            var result = _mongoDBService.ExecuteAggregation(_collectionName, countPipeline);
            return result.Any() ? result.First()["total"].AsInt32 : 0;
        }

        // Get paged data using aggregation
        public List<Dictionary<string, object>> GetPagedJobData(string[] columns, int pageNumber, int rowsPerPage)
        {
            var projection = CreateColumnProjection(columns);

            var pipeline = new BsonDocument[]
            {
        new BsonDocument("$unwind", "$Jobs"),
        new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs")),
        new BsonDocument("$project", projection),
        new BsonDocument("$skip", (pageNumber - 1) * rowsPerPage),
        new BsonDocument("$limit", rowsPerPage)
            };

            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);

            // The documents are already properly transformed by the projection stage
            // so we can convert them directly to dictionaries
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Get range of data using aggregation
        public List<Dictionary<string, object>> GetRangeJobData(string[] columns, int startIndex, int count)
        {
            var projection = CreateColumnProjection(columns);

            var pipeline = new BsonDocument[]
            {
        new BsonDocument("$unwind", "$Jobs"),
        new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs")),
        new BsonDocument("$project", projection),
        new BsonDocument("$skip", startIndex),
        new BsonDocument("$limit", count)
            };

            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);

            // The documents are already properly transformed by the projection stage
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

        // Create a match stage for search query with field mapping
        private BsonDocument CreateSearchMatchStage(string term, string type)
        {
            // Check if we have a mapping for this search field
            string fieldName = type;
            if (_fieldMappings.TryGetValue(type, out string mappedField))
            {
                fieldName = mappedField;
            }

            // Handle nested fields
            if (fieldName.Contains('.'))
            {
                // For nested fields like "Profile.Name"
                return new BsonDocument("$match", new BsonDocument(
                    fieldName, new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i"))));
            }
            else
            {
                // For regular fields
                return new BsonDocument("$match", new BsonDocument(
                    fieldName, new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i"))));
            }
        }

        // Search data with pagination
        public List<Dictionary<string, object>> SearchData(string term, string type, string[] columns, int page, int rowsPerPage)
        {
            var projection = CreateColumnProjection(columns);
            var matchStage = CreateSearchMatchStage(term, type);

            var pipeline = new BsonDocument[]
            {
        new BsonDocument("$unwind", "$Jobs"),
        new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs")),
        matchStage,
        new BsonDocument("$project", projection),
        new BsonDocument("$skip", (page - 1) * rowsPerPage),
        new BsonDocument("$limit", rowsPerPage)
            };

            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);

            // The documents are already properly transformed by the projection stage
            return results.Select(doc => doc.ToDictionary()).ToList();
        }

        // Search data with range
        public List<Dictionary<string, object>> SearchRangeData(string term, string type, string[] columns, int startIndex, int count)
        {
            var projection = CreateColumnProjection(columns);
            var matchStage = CreateSearchMatchStage(term, type);

            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$Jobs"),  // Changed from "job_list"
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs")),
                matchStage,
                new BsonDocument("$project", projection),
                new BsonDocument("$skip", startIndex),
                new BsonDocument("$limit", count)
            };

            var results = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return results.Select(doc => TransformResultKeys(doc)).ToList();
        }

        // Get count of search results
        public int SearchCount(string term, string type)
        {
            var matchStage = CreateSearchMatchStage(term, type);

            var pipeline = new BsonDocument[]
            {
                new BsonDocument("$unwind", "$Jobs"),  // Changed from "job_list"
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs")),
                matchStage,
                new BsonDocument("$count", "total")
            };

            var result = _mongoDBService.ExecuteAggregation(_collectionName, pipeline);
            return result.Any() ? result.First()["total"].AsInt32 : 0;
        }

        private Dictionary<string, object> TransformResultKeys(BsonDocument doc)
        {
            var result = new Dictionary<string, object>();
            var reverseMapping = _fieldMappings.ToDictionary(x => x.Value, x => x.Key);

            // Debug the input document
            Console.WriteLine($"Processing document: {doc.ToJson()}");

            foreach (var element in doc.Elements)
            {
                Console.WriteLine($"Processing element: {element.Name}");

                // Check if we have a reverse mapping for this field
                if (reverseMapping.TryGetValue(element.Name, out string uiColumnName))
                {
                    result[uiColumnName] = BsonExtensions.BsonValueToObject(element.Value);
                    Console.WriteLine($"Mapped {element.Name} to {uiColumnName}");
                }
                else
                {
                    // Handle possible nested field projections (when a dot notation field is projected)
                    bool isNestedField = false;
                    foreach (var mapping in _fieldMappings)
                    {
                        if (mapping.Value.Contains('.') && element.Name == mapping.Value)
                        {
                            result[mapping.Key] = BsonExtensions.BsonValueToObject(element.Value);
                            isNestedField = true;
                            Console.WriteLine($"Mapped nested field {element.Name} to {mapping.Key}");
                            break;
                        }
                    }

                    // If not a mapped nested field, use as is
                    if (!isNestedField)
                    {
                        result[element.Name] = BsonExtensions.BsonValueToObject(element.Value);
                    }
                }
            }

            // Handle the special case of nested fields that might be in the document
            // Look for any field mappings that use dot notation
            foreach (var mapping in _fieldMappings)
            {
                if (mapping.Value.Contains('.'))
                {
                    var parts = mapping.Value.Split('.');
                    if (doc.Contains(parts[0]) && doc[parts[0]].IsBsonDocument)
                    {
                        var nestedDoc = doc[parts[0]].AsBsonDocument;
                        if (nestedDoc.Contains(parts[1]))
                        {
                            result[mapping.Key] = BsonExtensions.BsonValueToObject(nestedDoc[parts[1]]);
                            Console.WriteLine($"Extracted nested value {parts[0]}.{parts[1]} to {mapping.Key}");
                        }
                    }
                }
            }

            return result;
        }

        // Helper method to extract nested values
        private object ExtractNestedValue(Dictionary<string, object> document, string path)
        {
            var parts = path.Split('.');
            object current = document;

            foreach (var part in parts)
            {
                if (current is Dictionary<string, object> dict)
                {
                    if (dict.TryGetValue(part, out object value))
                    {
                        current = value;
                    }
                    else
                    {
                        return null;  // Path doesn't exist
                    }
                }
                else
                {
                    return null;  // Current is not a dictionary
                }
            }

            return current;
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

        // Changed to public so it can be used in TransformResultKeys
        public static object BsonValueToObject(BsonValue value)
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