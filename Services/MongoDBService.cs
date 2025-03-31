using MongoDB.Driver;
using System;
using System.Collections.Generic;
using NovusDashboard.wwwroot.Configuration;
using NovusDashboard.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using NovusDashboard.wwwroot.Configuration;
using NovusDashboard.Models;


namespace NovusDashboard.Services
{
    public class MongoDBService
    {
        private readonly IMongoDatabase _database;

        public MongoDBService(IOptions<MongoDBSettings> mongoSettings, IMongoClient mongoClient)
        {
            _database = mongoClient.GetDatabase(mongoSettings.Value.DatabaseName);
        }

        public List<QueueEntry> GetCollectionAsList(string collectionName)
        {
            var collection = _database.GetCollection<QueueEntry>(collectionName);
            return collection.Find(FilterDefinition<QueueEntry>.Empty).ToList();
        }

        public IEnumerable<BsonDocument> ExecuteAggregation(string collectionName, BsonDocument[] pipeline, AggregateOptions options = null)
        {
            var collection = _database.GetCollection<BsonDocument>(collectionName);
            return options != null
                ? collection.Aggregate<BsonDocument>(pipeline, options).ToList()
                : collection.Aggregate<BsonDocument>(pipeline).ToList();
        }
        public List<T> ExecuteAggregation<T>(string collectionName, BsonDocument[] pipeline)
        {
            var collection = _database.GetCollection<T>(collectionName);
            return collection.Aggregate<T>(pipeline).ToList();
        }

    }

}
