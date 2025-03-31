using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using NovusDashboard.Services;
using NovusDashboard.Services.ProductionHistory;
using NovusDashboard.wwwroot.Configuration;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDB"));
builder.Services.AddSingleton<IMongoClient, MongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDBSettings>>().Value;
    var mongoClientSettings = MongoClientSettings.FromConnectionString(settings.ConnectionString);
    return new MongoClient(mongoClientSettings);


});
builder.Services.AddSingleton<MongoDBService>();
builder.Services.AddSingleton<CollectionService>();
builder.Services.AddScoped<TablePreferencesService>();
builder.Services.AddSingleton<BundleManagerService>();
// Ensure directory exists
var appDataPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "tabledata");
if (!Directory.Exists(appDataPath))
{
    Directory.CreateDirectory(appDataPath);
}

var app = builder.Build();

app.UseStaticFiles();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
