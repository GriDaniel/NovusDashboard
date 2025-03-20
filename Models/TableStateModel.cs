// Models/TableStateModel.cs
using System.Text.Json.Serialization;

namespace NovusDashboard.Models
{
    public class TableStateModel
    {
        public bool IsExpanded { get; set; } = false;
        public int RowCount { get; set; } = 0;
        public int ColCount { get; set; } = 0;
        public List<string> ColumnTitles { get; set; } = new List<string>();

        [JsonIgnore]
        private const int MaxColumnCount = 9;
        public void ValidateAndTrim()
        {
            if (ColumnTitles.Count > MaxColumnCount)
            {
                ColumnTitles = ColumnTitles.GetRange(0, MaxColumnCount);
            }

            // Ensure ColCount matches actual column titles
            ColCount = ColumnTitles.Count;
        }
    }
}