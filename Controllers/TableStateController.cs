// Controllers/TableStateController.cs
using Microsoft.AspNetCore.Mvc;
using NovusDashboard.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NovusDashboard.Controllers
{
    public class TableStateController : Controller
    {
        private readonly TableStateService _stateService;

        public TableStateController(TableStateService stateService)
        {
            _stateService = stateService;
        }

       
        public async Task<IActionResult> GetState()
        {
            var state = await _stateService.GetStateAsync();
            return Ok(state);
        }

      
        public async Task<IActionResult> Expand()
        {
            await _stateService.SetExpandedAsync(true);
            return Ok();
        }

      
        public async Task<IActionResult> Collapse()
        {
            await _stateService.SetExpandedAsync(false);
            return Ok();
        }

     
        public async Task<IActionResult> UpdateDimensions([FromBody] Dimensions dims)
        {
            await _stateService.UpdateDimensionsAsync(dims.RowCount, dims.ColCount);
            return Ok();
        }

      
        public async Task<IActionResult> UpdateColumnTitles([FromBody] List<string> titles)
        {
            await _stateService.UpdateColumnTitlesAsync(titles);
            return Ok();
        }

        public async Task<IActionResult> DeleteColumnTitle(int index)
        {
            await _stateService.DeleteColumnTitleAsync(index);
            return Ok();
        }

       
        public async Task<IActionResult> SwapColumnTitles([FromBody] SwapRequest request)
        {
            await _stateService.SwapColumnTitlesAsync(request.Index1, request.Index2);
            return Ok();
        }
    }

    public class Dimensions
    {
        public int RowCount { get; set; }
        public int ColCount { get; set; }
    }

    public class SwapRequest
    {
        public int Index1 { get; set; }
        public int Index2 { get; set; }
    }
}