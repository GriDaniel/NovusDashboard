using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace NovusDashboard.Services
{
    public class BundleManagerService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<BundleManagerService> _logger;

        public BundleManagerService(IWebHostEnvironment environment, ILogger<BundleManagerService> logger)
        {
            _environment = environment;
            _logger = logger;
        }
        public bool VerifyAllBundlesExist()
        {
            // Get the base dist path
            var distPath = Path.Combine(_environment.WebRootPath, "dist", "js");
            var productionHistoryPath = Path.Combine(distPath, "productionhistory");

            // Define all required bundle files to check based on the gulp file
            var requiredBundles = new Dictionary<string, string>
            {
                { Path.Combine(productionHistoryPath, "elementmanagers", "element-managers.min.js"), "processElementManagers" },
                { Path.Combine(productionHistoryPath, "modules", "modules.min.js"), "processModules" },
                { Path.Combine(productionHistoryPath, "utilities", "utilities.min.js"), "processUtilities" },
                { Path.Combine(productionHistoryPath, "index.min.js"), "processIndex" }
            };

            bool allBundlesExist = true;
            var missingBundles = new List<string>();

            foreach (var bundle in requiredBundles)
            {
                bool bundleExists = File.Exists(bundle.Key);

                if (!bundleExists)
                {
                    _logger.LogWarning("Bundle {Bundle} not found", Path.GetFileName(bundle.Key));
                    missingBundles.Add(Path.GetFileName(bundle.Key));
                    allBundlesExist = false;
                }
                else
                {
                    _logger.LogInformation("Bundle {Bundle} exists", Path.GetFileName(bundle.Key));
                }
            }
            if (!allBundlesExist)
            {
                _logger.LogWarning("Missing bundles: {MissingBundles}", string.Join(", ", missingBundles));
                _logger.LogInformation("Please run 'npx gulp build' to generate the missing bundles");
            }
            else
            {
                _logger.LogInformation("All required bundles exist");
            }

            return allBundlesExist;
        }

    }
}