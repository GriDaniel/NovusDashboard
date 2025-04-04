document.addEventListener("DOMContentLoaded", async function() {
  let a = {
      baseUrl: "",
      defaultColumnTitles: ["Name", "Profile Name", "File Path"],
      defaultRowCount: 10,
      apiEndpoints: {
        getPreferences: "/TablePreferences/GetPreferences",
        updateColumns: "/TablePreferences/UpdateColumns",
        updateRowCount: "/TablePreferences/UpdateRowCount"
      },
      useServerPreferences: !0,
      initialPage: 1
    },
    o = (e, n) => {
      console.error(`[TableInit] ${e}:`, n)
    };

  function e(n, t) {
    let a;
    return function(...e) {
      clearTimeout(a), a = setTimeout(() => n.apply(this, e), t)
    }
  }
  try {
    var n = document.querySelector(".data-table"),
      t = document.querySelectorAll(".dropdown-container");
    if (!n) throw new Error("Data table container not found");
    r = n, [() => SearchElementManager.initialize(r), () => RowElementManager.initialize(r), () => ColumnElementManager.initialize(r), () => TableElementManager.initialize(r), () => DropdownElementManager.initialize(r), () => PaginationElementManager.initialize(r), () => SearchBarModule.initialize(r), () => SortIndicatorElementManager.initialize(r), () => ColumnManagerModule.initialize(), () => RowManagerModule.initialize(), () => SortIndicatorModule.initialize()].forEach(e => {
      try {
        e()
      } catch (e) {
        o("Module initialization failed", e)
      }
    });
    var i = await (async () => {
      var n = {
        columnTitles: a.defaultColumnTitles,
        rowCount: a.defaultRowCount
      };
      if (!a.useServerPreferences) return n;
      try {
        var e, t = await fetch(a.baseUrl + a.apiEndpoints.getPreferences);
        if (t.ok) return {
          columnTitles: 0 < (e = await t.json())?.columnTitles?.length ? e.columnTitles : a.defaultColumnTitles,
          rowCount: 5 <= e?.rowCount && e?.rowCount <= 35 ? e.rowCount : a.defaultRowCount
        };
        throw new Error("Server returned " + t.status)
      } catch (e) {
        return o("Failed to fetch preferences", e), n
      }
    })();
    ColumnManagerModule.addColumns(i.columnTitles.length, i.columnTitles), DropdownContainerModule.initialize(t), TableDataModule.initialize(), DataApplierModule.initialize(), RowManagerModule.setRowCountWithData(i.rowCount, a.initialPage), DropdownContainerModule.setSelectedRowCount(i.rowCount), PaginationModule.initialize(), TableTitleModule.initialize(), document.addEventListener("columnManager:columnsChanged", e(() => {
      (async () => {
        if (a.useServerPreferences) try {
          var e = ColumnElementManager.getColumnHeaders();
          await fetch(a.baseUrl + a.apiEndpoints.updateColumns, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(e)
          })
        } catch (e) {
          o("Failed to update column titles", e)
        }
      })()
    }, 500)), document.addEventListener("dropdown:rowCountChanged", e(e => {
      (async e => {
        if (a.useServerPreferences) try {
          await fetch(a.baseUrl + a.apiEndpoints.updateRowCount, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(e)
          })
        } catch (e) {
          o("Failed to update row count", e)
        }
      })(e.detail.rowCount)
    }, 500)), window.addEventListener("beforeunload", () => {
      try {
        var e = ColumnElementManager.getColumnHeaders(),
          n = DropdownContainerModule.getSelectedRowCount();
        navigator.sendBeacon(a.baseUrl + a.apiEndpoints.updateColumns, new Blob([JSON.stringify(e)], {
          type: "application/json"
        })), navigator.sendBeacon(a.baseUrl + a.apiEndpoints.updateRowCount, new Blob([JSON.stringify(n)], {
          type: "application/json"
        }))
      } catch (e) {
        o("Failed to save preferences on unload", e)
      }
    })
  } catch (e) {
    o("Table initialization failed", e)
  }
  var r
});
//# sourceMappingURL=index.min.js.map