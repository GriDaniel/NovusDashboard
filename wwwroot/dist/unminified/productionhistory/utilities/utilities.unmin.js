let DataApplierModule = (() => {
    let n = null;
    class e {
      constructor() {
        this.currentPage = 1, this.isPageChangeInProgress = !1, this._initEventListeners()
      }
      _initEventListeners() {
        document.addEventListener("tableData:rowDataFetched", this._handleRowDataFetched.bind(this)), document.addEventListener("tableData:pageDataFetched", this._handlePageDataFetched.bind(this)), document.addEventListener("tableData:columnDataFetched", this._handleColumnDataFetched.bind(this)), document.addEventListener("tableData:searchDataFetched", this._handleSearchDataFetched.bind(this)), document.addEventListener("tableData:searchCleared", this._handleSearchDataCleared.bind(this)), document.addEventListener("tableData:sortDataFetched", this._handleSortDataFetched.bind(this)), document.addEventListener("tableData:sortCleared", this._handleSortDataCleared.bind(this)), document.addEventListener("tableData:pageOutOfBounds", this._handlePageOutOfBounds.bind(this)), document.addEventListener("columnManager:columnSwapped", this._handleColumnSwapped.bind(this)), document.addEventListener("pagination:pageChanged", e => {
          this.currentPage = e.detail.page || 1
        })
      }
      _handleRowDataFetched(e) {
        var {
          rows: e,
          data: t,
          columns: a,
          currentPage: n
        } = e.detail;
        e?.length && t && (this.currentPage = n, this.applyDataToRows(e, t, a), this._dispatchDataEvent("dataApplied", {
          rows: e,
          rowsData: t
        }))
      }
      _handlePageDataFetched(e) {
        let {
          page: t,
          rowCount: a,
          totalCount: n,
          data: r,
          columns: l,
          needsRowUpdate: o
        } = e.detail;
        this.currentPage = t, this.isPageChangeInProgress = !0;
        try {
          let e;
          o ? DOMUtils.batchUpdate(() => {
            0 < a && (RowManagerModule.setRowCount(a), e = RowManagerModule.getAllRows(), this.applyDataToRows(e, r, l))
          }) : (e = RowManagerModule.clearRowData(), this.applyDataToRows(e, r, l)), this._dispatchDataEvent("pageDataApplied", {
            page: t,
            rowCount: a,
            totalCount: n,
            rows: e,
            data: r
          })
        } catch (e) {
          console.error(`Error applying page data for page ${t}:`, e)
        } finally {
          this.isPageChangeInProgress = !1
        }
      }
      _handleColumnDataFetched(e) {
        var {
          column: e,
          columnIndex: t,
          data: a,
          page: n
        } = e.detail;
        a && (this.currentPage = n, n = RowManagerModule.getAllRows(), this.applyDataToColumn(n, a, e, t))
      }
      _handleFilterOperation(e, t) {
        var {
          page: a,
          rowCount: n,
          columns: r,
          data: l,
          needsRowUpdate: o,
          totalCount: s,
          totalResults: d
        } = e.detail, i = {};
        "search" === t ? (i.term = e.detail.term, i.type = e.detail.type, i.totalResults = d) : ("sort" === t && (i.column = e.detail.column, i.direction = e.detail.direction), i.totalResults = s), this.isPageChangeInProgress = !0;
        try {
          this.currentPage = a;
          this._updateRowsAndApplyData(n, l, r, o);
          var h = {
            search: "searchApplied",
            searchClear: "searchCleared",
            sort: "sortApplied",
            sortClear: "sortCleared"
          };
          this._dispatchDataEvent(h[t], {
            page: a,
            rowCount: n,
            totalResults: i.totalResults,
            columns: r,
            ...i
          })
        } catch (e) {
          console.error(`Error handling ${t} operation:`, e)
        } finally {
          this.isPageChangeInProgress = !1
        }
      }
      _handleSearchDataFetched(e) {
        this._handleFilterOperation(e, "search")
      }
      _handleSearchDataCleared(e) {
        this._handleFilterOperation(e, "searchClear")
      }
      _handleSortDataFetched(e) {
        this._handleFilterOperation(e, "sort")
      }
      _handleSortDataCleared(e) {
        this._handleFilterOperation(e, "sortClear")
      }
      _handlePageOutOfBounds(e) {
        var {
          currentPage: e,
          maxValidPage: t
        } = e.detail;
        PaginationModule?.goToPage && e !== t && PaginationModule.goToPage(t)
      }
      _handleColumnSwapped(e) {
        let {
          index1: a,
          index2: n
        } = e.detail, t = RowManagerModule.getAllRows();
        t?.length && (DOMUtils.batchUpdate(() => {
          t.forEach(e => {
            var t, e = RowElementManager.getCellsForRow(e);
            e.length > Math.max(a, n) && (t = e[a].textContent, e[a].textContent = e[n].textContent, e[n].textContent = t)
          })
        }), this._dispatchDataEvent("columnSwapped", e.detail))
      }
      _updateRowsAndApplyData(e, t, a, n = !0) {
        let r;
        return n ? DOMUtils.batchUpdate(() => {
          RowManagerModule.deleteAllRows(), 0 < e && (r = RowManagerModule.addRows(e))
        }) : r = RowManagerModule.clearRowData(), r?.length && 0 < e && t && this.applyDataToRows(r, t, a), r
      }
      applyDataToRows(e, t, a) {
        let n = Array.isArray(t) ? t : t.rows || [];
        n?.length && DOMUtils.batchUpdate(() => {
          e.forEach((e, t) => {
            t >= n.length || (t = n[t]) && this._applyRowData(e, t, a)
          }), RowManagerModule.closeAllExpandedRows()
        })
      }
      _applyRowData(e, a, t) {
        let n = RowElementManager.getCellsForRow(e);
        t.forEach((e, t) => {
          t >= n.length || (e = null != (e = this.extractValueFromData(a, e)) ? this.formatCellValue(e) : "", n[t].textContent !== e && (n[t].textContent = e))
        })
      }
      applyDataToColumn(e, a, n, r) {
        e?.length && a?.length && (DOMUtils.batchUpdate(() => {
          e.forEach((e, t) => {
            t >= a.length || (t = a[t]) && (e = RowElementManager.getCellsForRow(e), r >= e.length || (t = null != (t = this.extractValueFromData(t, n)) ? this.formatCellValue(t) : "", e[r].textContent !== t && (e[r].textContent = t)))
          })
        }), this._dispatchDataEvent("columnDataApplied", {
          column: n,
          columnIndex: r,
          rows: e,
          data: a
        }))
      }
      extractValueFromData(e, t) {
        return e.hasOwnProperty(t) ? e[t] : null
      }
      formatCellValue(e) {
        return null == e ? "" : "object" == typeof e ? JSON.stringify(e) : String(e)
      }
      _dispatchDataEvent(e, t) {
        document.dispatchEvent(new CustomEvent("dataApplier:" + e, {
          bubbles: !0,
          detail: t
        }))
      }
      setCurrentPage(e) {
        this.currentPage = e || 1, TableDataModule.setCurrentPage && TableDataModule.setCurrentPage(this.currentPage)
      }
    }
    return {
      initialize() {
        return n = n || new e
      },
      getInstance: () => n,
      setCurrentPage: e => n?.setCurrentPage(e),
      applyDataToRows: (e, t, a) => n?.applyDataToRows(e, t, a)
    }
  })(),
  PerformanceTracker = (() => {
    let a = {};
    return {
      start(e) {
        a[e] = performance.now()
      },
      end(e) {
        var t;
        return a[e] ? (t = performance.now() - a[e], delete a[e], t) : null
      }
    }
  })(),
  DOMUtils = (() => {
    let t = [],
      a = !1;
    return {
      batchUpdate(e) {
        "function" != typeof e ? console.error("DOMUtils: Invalid update function") : (t.push(e), this.scheduleProcess())
      },
      scheduleProcess() {
        a || (a = !0, requestAnimationFrame(() => this.processUpdates()))
      },
      processUpdates() {
        PerformanceTracker.start("processDomUpdates");
        var e = [...t];
        t.length = 0, a = !1, e.forEach(e => {
          try {
            e()
          } catch (e) {
            console.error("DOMUtils: Error in update operation:", e)
          }
        }), PerformanceTracker.end("processDomUpdates")
      }
    }
  })(),
  ElementCache = (() => {
    let s = new Map;
    return {
      createCache(o) {
        return o ? (s.has(o) || s.set(o, {
          containerElementMaps: new WeakMap
        }), {
          get(e, t, a = !1) {
            if (!e || !t) return null;
            var n = s.get(o);
            let r = n.containerElementMaps.get(t);
            return r || (r = new Map, n.containerElementMaps.set(t, r)), !a && r.has(e) ? r.get(e) : ((n = t.querySelector(e)) && r.set(e, n), n)
          },
          set(t, a, n) {
            if (t && a && n) {
              var r = s.get(o);
              let e = r.containerElementMaps.get(n);
              e || (e = new Map, r.containerElementMaps.set(n, e)), e.set(t, a)
            }
          },
          clear(e = null) {
            var t = s.get(o);
            e ? (e = t.containerElementMaps.get(e)) && e.clear() : t.containerElementMaps = new WeakMap
          },
          getAll(e, t, a = !1) {
            if (!e || !t) return [];
            var n = s.get(o),
              r = "collection:" + e;
            let l = n.containerElementMaps.get(t);
            return l || (l = new Map, n.containerElementMaps.set(t, l)), !a && l.has(r) ? l.get(r) : (n = Array.from(t.querySelectorAll(e)), l.set(r, n), n)
          }
        }) : (console.error("ElementCache: Module ID required"), null)
      }
    }
  })();
//# sourceMappingURL=utilities.min.js.map