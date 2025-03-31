using MongoDB.Bson;
using MongoDB.Driver;
using System.Collections;
using System.Diagnostics;
using System.Text.RegularExpressions;

namespace NovusDashboard.Services
{
    public class CollectionService
    {
        private readonly MongoDBService _mongoDBService;
        private readonly string _collectionName;
        private readonly Dictionary<string, string> _fieldMappings;
        private readonly Dictionary<string, Stopwatch> _performanceTimers = new Dictionary<string, Stopwatch>();

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

        private void StartTimer(string operation)
        {
            var timer = new Stopwatch();
            timer.Start();
            _performanceTimers[operation] = timer;
            Console.WriteLine($"[PERF] Starting timer for: {operation}");
        }

        private long StopTimer(string operation)
        {
            if (_performanceTimers.TryGetValue(operation, out var timer))
            {
                timer.Stop();
                var elapsed = timer.ElapsedMilliseconds;
                Console.WriteLine($"[PERF] {operation} completed in {elapsed}ms");
                _performanceTimers.Remove(operation);
                return elapsed;
            }
            return 0;
        }

        // Helper methods preserved from original implementation
        public BsonDocument CreateColumnProjection(string[] displayColumns)
        {
            StartTimer("CreateColumnProjection");

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

            StopTimer("CreateColumnProjection");
            return projectionDoc;
        }

        private BsonDocument CreateSearchMatchStage(string term, string type)
        {
            StartTimer("CreateSearchMatchStage");

            // Check if we have a mapping for this search field
            string fieldName = type;
            if (_fieldMappings.TryGetValue(type, out string mappedField))
            {
                fieldName = mappedField;
                Console.WriteLine($"[PERF] Mapped search field {type} to {fieldName}");
            }

            BsonDocument matchStage;
            // Handle nested fields
            if (fieldName.Contains('.'))
            {
                // For nested fields like "Profile.Name"
                matchStage = new BsonDocument("$match", new BsonDocument(
                    fieldName, new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i"))));
                Console.WriteLine($"[PERF] Created nested field match for {fieldName}");
            }
            else
            {
                // For regular fields
                matchStage = new BsonDocument("$match", new BsonDocument(
                    fieldName, new BsonDocument("$regex", new BsonRegularExpression($".*{term}.*", "i"))));
                Console.WriteLine($"[PERF] Created regular field match for {fieldName}");
            }

            StopTimer("CreateSearchMatchStage");
            return matchStage;
        }

        private BsonDocument CreateSortStage(string sortColumn, int sortOrder)
        {
            StartTimer("CreateSortStage");

            // Map the sort column if needed
            string mappedSortField = sortColumn;
            if (_fieldMappings.TryGetValue(sortColumn, out string mappedField))
            {
                mappedSortField = mappedField;
                Console.WriteLine($"[PERF] Mapped sort column {sortColumn} to {mappedSortField}");
            }

            var sortStage = new BsonDocument("$sort", new BsonDocument(mappedSortField, sortOrder));

            StopTimer("CreateSortStage");
            return sortStage;
        }

        private Dictionary<string, object> TransformResultKeys(BsonDocument doc)
        {
            StartTimer("TransformResultKeys");

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

            StopTimer("TransformResultKeys");
            return result;
        }

        // UNIFIED DATA RETRIEVAL METHOD
        /// <summary>
        /// Unified method for retrieving data with filtering, sorting, and pagination
        /// </summary>
        public List<Dictionary<string, object>> GetData(
            string[] columns,
            int startIndex,
            int count,
            string searchTerm = null,
            string searchType = null,
            string sortColumn = null,
            int? sortOrder = null)
        {
            StartTimer($"GetData_{startIndex}_{count}");
            Console.WriteLine($"[PERF] Unified data retrieval: StartIndex {startIndex}, Count {count}, " +
                            $"Search {searchTerm}/{searchType}, Sort {sortColumn}/{sortOrder}");

            // Create projection for columns
            StartTimer("GetData_CreateProjection");
            var projection = CreateColumnProjection(columns);
            StopTimer("GetData_CreateProjection");

            // Build pipeline stages
            StartTimer("GetData_BuildPipeline");
            var pipelineStages = new List<BsonDocument>
            {
                new BsonDocument("$unwind", "$Jobs"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs"))
            };

            // Add search stage if provided
            if (!string.IsNullOrEmpty(searchTerm) && !string.IsNullOrEmpty(searchType))
            {
                pipelineStages.Add(CreateSearchMatchStage(searchTerm, searchType));
            }

            // Add sort stage if provided
            if (!string.IsNullOrEmpty(sortColumn) && sortOrder.HasValue)
            {
                // For non-nested fields, add case-insensitive sorting
                var tempFieldDoc = new BsonDocument();
                tempFieldDoc.Add("_tempSortField", new BsonDocument("$toLower", $"${sortColumn}"));
                pipelineStages.Add(new BsonDocument("$addFields", tempFieldDoc));
                pipelineStages.Add(new BsonDocument("$sort", new BsonDocument("_tempSortField", sortOrder.Value)));
            }

            // Add projection stage
            pipelineStages.Add(new BsonDocument("$project", projection));

            // Add pagination stages
            pipelineStages.Add(new BsonDocument("$skip", startIndex));
            pipelineStages.Add(new BsonDocument("$limit", count));
            StopTimer("GetData_BuildPipeline");

            // Execute the pipeline
            StartTimer("GetData_ExecuteAggregation");
            var results = _mongoDBService.ExecuteAggregation(
                _collectionName,
                pipelineStages.ToArray(),
                new AggregateOptions
                {
                    Collation = new Collation("en", strength: CollationStrength.Secondary)
                });
            StopTimer("GetData_ExecuteAggregation");

            // Transform results
            StartTimer("GetData_TransformResults");
            var data = results.Select(doc => TransformResultKeys(doc)).ToList();
            StopTimer("GetData_TransformResults");

            Console.WriteLine($"[PERF] Retrieved {data.Count} records");
            StopTimer($"GetData_{startIndex}_{count}");

            return data;
        }

        // UNIFIED COUNT METHOD
        /// <summary>
        /// Unified method for getting counts with optional filtering
        /// </summary>
        public int GetCount(string searchTerm = null, string searchType = null)
        {
            StartTimer($"GetCount_{searchTerm}_{searchType}");
            Console.WriteLine($"[PERF] Unified count: Search {searchTerm}/{searchType}");

            // Build pipeline stages
            StartTimer("GetCount_BuildPipeline");
            var pipelineStages = new List<BsonDocument>
            {
                new BsonDocument("$unwind", "$Jobs"),
                new BsonDocument("$replaceRoot", new BsonDocument("newRoot", "$Jobs"))
            };

            // Add search stage if provided
            if (!string.IsNullOrEmpty(searchTerm) && !string.IsNullOrEmpty(searchType))
            {
                pipelineStages.Add(CreateSearchMatchStage(searchTerm, searchType));
            }

            // Add count stage
            pipelineStages.Add(new BsonDocument("$count", "total"));
            StopTimer("GetCount_BuildPipeline");

            // Execute the pipeline
            StartTimer("GetCount_ExecuteAggregation");
            var result = _mongoDBService.ExecuteAggregation(_collectionName, pipelineStages.ToArray());
            StopTimer("GetCount_ExecuteAggregation");

            // Get count
            var count = result.Any() ? result.First()["total"].AsInt32 : 0;

            Console.WriteLine($"[PERF] Count: {count}");
            StopTimer($"GetCount_{searchTerm}_{searchType}");

            return count;
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