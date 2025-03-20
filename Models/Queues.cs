using MongoDB.Bson.Serialization.Attributes;

namespace NovusDashboard.Models
{

    public class QueueEntry
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public Guid Id { get; set; }

        [BsonElement("job_list")]
        public List<Job> job_list { get; set; } = new List<Job>();
    }

    public class Job
    {
        [BsonElement("Name")]
        public string Name { get; set; }

        [BsonElement("Your Content")]
        public string YourContent { get; set; }

        [BsonElement("Duration")]
        public string Duration { get; set; }

        [BsonElement("File Path")]
        public string FilePath { get; set; }

        [BsonElement("profile")]
        public Profile Profile { get; set; }

        [BsonElement("Length")]
        public string Length { get; set; }

        [BsonElement("Front Cut-off Distance")]
        public string FrontCutOffDistance { get; set; }

        [BsonElement("Cut-off Length")]
        public string CutOffLength { get; set; }

        [BsonElement("Square-up Distance")]
        public string SquareUpDistance { get; set; }

        [BsonElement("Date")]
        public DateTime Date { get; set; }
    }

    public class Profile
    {
        [BsonElement("name")]
        public string Name { get; set; }
    }
}
