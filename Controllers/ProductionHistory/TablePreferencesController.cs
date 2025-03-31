using Microsoft.AspNetCore.Mvc;
using NovusDashboard.Services.ProductionHistory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NovusDashboard.Controllers.ProductionHistory
{
    public class TablePreferencesController : Controller
    {
        private readonly TablePreferencesService _prefsService;

        public TablePreferencesController(TablePreferencesService prefsService)
        {
            _prefsService = prefsService;
        }

        public async Task<IActionResult> GetPreferences()
        {
            var prefs = await _prefsService.GetPreferencesAsync();
            return Ok(prefs);
        }

        public async Task<IActionResult> UpdateColumns([FromBody] List<string> titles)
        {
            await _prefsService.UpdateColumnTitlesAsync(titles);
            return Ok();
        }

        public async Task<IActionResult> UpdateRowCount([FromBody] int rowCount)
        {
            await _prefsService.UpdateRowCountAsync(rowCount);
            return Ok();
        }
    }
}