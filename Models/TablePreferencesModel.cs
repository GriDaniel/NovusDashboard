using System.Collections.Generic;

namespace NovusDashboard.Models
{
    public class TablePreferencesModel
    {
        public List<string> ColumnTitles { get; set; } = new List<string>();
        public int RowCount { get; set; } = 10;

        public void ValidateAndTrim()
        {
            // Ensure column titles exist
            ColumnTitles ??= new List<string>();

            // Ensure valid row count
            if (RowCount < 5) RowCount = 5;
            if (RowCount > 35) RowCount = 35;
        }
    }
}