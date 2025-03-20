using MongoDB.Bson.Serialization.Attributes;

namespace NovusDashboard.Models
{

    public class QueueEntry
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public Guid Id { get; set; }

        [BsonElement("Jobs")]
        public List<Job> Jobs { get; set; } = new List<Job>();
    }

    public class Job
    {
        [BsonElement("Name")]
        public string Name { get; set; }

        [BsonElement("Your Content")]
        public string YourContent { get; set; }

        [BsonElement("Duration")]
        public string Duration { get; set; }

        [BsonElement("FilePath")]
        public string FilePath { get; set; }

        [BsonElement("Profile")]
        public Profile Profile { get; set; }

        [BsonElement("Length")]
        public string Length { get; set; }

        [BsonElement("FrontCutOffDistance")]
        public string FrontCutOffDistance { get; set; }

        [BsonElement("Cut-off Length")]
        public string CutOffLength { get; set; }

        [BsonElement("SquareUpDistance")]
        public string SquareUpDistance { get; set; }

        [BsonElement("Date")]
        public DateTime Date { get; set; }
    }

    public class Profile
    {
        [BsonElement("Name")]
        public string Name { get; set; }
    }
}
