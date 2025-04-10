let ColumnManagerModule = (() => {
    let n = null;
    class e {
      constructor() {
        if (!ColumnElementManager.getInstance()) throw new Error("ColumnElementManager must be initialized before ColumnManagerModule");
        if (SortIndicatorElementManager.getInstance() || SortIndicatorElementManager.initialize(document.body), SortIndicatorModule.getInstance() || SortIndicatorModule.initialize(), this.columnInsertionPoint = ColumnElementManager.getColumnInsertionPoint(), !this.columnInsertionPoint) throw new Error("Column insertion point not found");
        this.columnCount = ColumnElementManager.getColumnCount(), this.initializeSortIndicators()
      }
      initializeSortIndicators() {
        ColumnElementManager.getAllColumns(!0).forEach((e, t) => this.setupColumnSortIndicators(e, t))
      }
      setupColumnSortIndicators(e, t) {
        var n;
        e && (n = e.querySelector("." + ColumnElementManager.getSortIndicatorPlaceholderClass())) && (e = (e = e.querySelector("." + ColumnElementManager.getColumnTitleClass())) ? e.textContent.trim() : "", SortIndicatorModule.registerContainer(n, t, {
          source: "column",
          columnName: e
        }))
      }
      createColumn(e) {
        var e = ColumnElementManager.createColumnTemplate(e),
          t = this.columnCount;
        return this.setupColumnSortIndicators(e, t), e
      }
      addColumns(t, e) {
        if ((t = parseInt(t, 10) || 0) <= 0) return [];
        var n = Array.isArray(e) ? e : [],
          a = document.createDocumentFragment(),
          o = [];
        for (let e = 0; e < t; e++) {
          var r = e < n.length ? n[e] : "Column " + (this.columnCount + e + 1),
            r = this.createColumn(r);
          a.appendChild(r), o.push(r)
        }
        ColumnElementManager.appendColumns(o, this.columnInsertionPoint), this.columnCount += t, ColumnElementManager.setColumnCount(this.columnCount);
        e = this.createCellsForColumn(t);
        return this._dispatchColumnEvent("columnsAdded", {
          count: t,
          columns: o,
          cells: e
        }), o
      }
      addColumn(e) {
        return this.addColumns(1, [e])[0]
      }
      createCellsForColumn(e = 1) {
        return RowElementManager.getInstance() ? RowElementManager.createCellsForColumns(e) : (console.error("RowElementManager required for createCellsForColumn"), [])
      }
      removeCellsAtColumnIndex(e) {
        RowElementManager.getInstance() ? RowElementManager.removeCellsAtColumnIndex(e) : console.error("RowElementManager required for removeCellsAtColumnIndex")
      }
      deleteColumn(e, t) {
        var n;
        this.columnCount <= 0 || (e < 0 || e >= this.columnCount ? console.warn("Column index out of bounds") : !(n = ColumnElementManager.getAllColumns(!0)) || n.length <= e || (n = n[e], ColumnElementManager.removeColumn(n), this.removeCellsAtColumnIndex(e), this.columnCount--, ColumnElementManager.setColumnCount(this.columnCount), ColumnElementManager.removeColumnByTitle(t), this._dispatchColumnEvent("columnDeleted", {})))
      }
      getColumnHeaders() {
        return ColumnElementManager.getColumnHeaders(!1)
      }
      getColumnCount() {
        return this.columnCount
      }
      getColumnByIndex(e) {
        return ColumnElementManager.getColumnByIndex(e, !0)
      }
      getAllColumns() {
        return ColumnElementManager.getAllColumns(!0)
      }
      _dispatchColumnEvent(e, t) {
        this.columnInsertionPoint.dispatchEvent(new CustomEvent("columnManager:" + e, {
          bubbles: !0,
          detail: t
        }))
      }
    }
    return {
      initialize() {
        try {
          return n = n || new e
        } catch (e) {
          throw console.error("Error initializing ColumnManager:", e), e
        }
      },
      getInstance: () => n,
      createColumn: e => n?.createColumn(e) ?? null,
      addColumns: (e, t) => n?.addColumns(e, t) ?? [],
      addColumn: e => n?.addColumn(e) ?? null,
      deleteColumn: (e, t) => n?.deleteColumn(e, t),
      getColumnHeaders: () => n?.getColumnHeaders() ?? [],
      getColumnCount: () => n?.getColumnCount() ?? 0,
      getColumnByIndex: e => n?.getColumnByIndex(e) ?? null,
      getAllColumns: () => n?.getAllColumns() ?? []
    }
  })(),
  DropdownContainerModule = (() => {
    let t = null;
    class n {
      static SUPPORTED_COLUMNS = ["Name", "File Path", "Profile Name", "Length", "Front-cut Off Distance", "Square-up Distance"];
      constructor() {
        this.instances = new Map, this._lastSelectedRow = null, this.dropdownTypeConfig = {
          row: {
            elements: {
              button: DropdownElementManager.getDropdownButton,
              valueContainer: DropdownElementManager.getValueContainer,
              valueText: DropdownElementManager.getValueText,
              customInput: DropdownElementManager.getCustomInput,
              setButton: DropdownElementManager.getSetButton
            },
            setup: this.setupRowDropdown.bind(this)
          },
          column: {
            elements: {
              button: DropdownElementManager.getDropdownButton,
              checkboxList: DropdownElementManager.getCheckboxList,
              checkboxItem: DropdownElementManager.getCheckboxItem
            },
            setup: this.setupColumnDropdown.bind(this)
          },
          sort: {
            elements: {
              button: DropdownElementManager.getDropdownButton,
              closeIcon: DropdownElementManager.getCloseIcon
            },
            setup: this.setupSortDropdown.bind(this)
          },
          search: {
            elements: {
              button: DropdownElementManager.getDropdownButton,
              searchBar: () => SearchElementManager.getSearchInput(!1)
            },
            setup: this.setupSearchDropdown.bind(this)
          },
          "column-title": {
            elements: {
              button: DropdownElementManager.getDropdownButtonColumn
            },
            setup: this.setupColumnTitleDropdown.bind(this)
          }
        }
      }
      createDropdown(n, e) {
        if (!n || !e) return null;
        var t = this.dropdownTypeConfig[e];
        if (!t) return console.warn("Unknown dropdown type: " + e), null;
        let a = {
          content: DropdownElementManager.getDropdownContent(n),
          arrow: DropdownElementManager.getArrow(n),
          staticInputButtons: DropdownElementManager.getStaticInputButtons(n)
        };
        Object.entries(t.elements).forEach(([e, t]) => {
          a[e] = t(n)
        });
        e = {
          container: n,
          type: e,
          elements: a,
          isOpen: !1,
          isInEditMode: !0,
          selectedItem: null,
          hasCustomValue: !1
        };
        return this.setupToggle(e), t.setup(e), e
      }
      initializeDropdowns(e) {
        DropdownElementManager.getInstance() || DropdownElementManager.initialize(document.body), (Array.isArray(e) || e instanceof NodeList ? e : [e]).forEach(e => {
          var t = DropdownElementManager.getDropdownType(e);
          t && (t = this.createDropdown(e, t)) && this.instances.set(e, t)
        })
      }
      getDropdownInstance(e) {
        return this.instances.get(e) || null
      }
      getInstancesByType(e) {
        if (!e) return [];
        let t = [];
        return DropdownElementManager.getInstancesByType(e).forEach(e => {
          e = this.instances.get(e);
          e && t.push(e)
        }), t
      }
      setupToggle(t) {
        let {
          button: n,
          content: a
        } = t.elements, e = DropdownElementManager.getClassName("showClass"), o = DropdownElementManager.getClassName("openClass"), r = SortIndicatorElementManager.getSortIndicatorsClass();
        n.addEventListener("click", () => {
          a.classList.contains(e) ? this.closeDropdown(t) : (this.closeAllDropdowns(), DOMUtils.batchUpdate(() => {
            a.classList.add(e), t.elements.arrow && t.elements.arrow.classList.add(o)
          }), t.isOpen = !0, setTimeout(() => {
            document.addEventListener("click", t.outsideClickHandler = e => {
              "sort" === t.type && e.target.closest("." + r) || n.contains(e.target) || a.contains(e.target) || this.closeDropdown(t)
            })
          }, 0))
        })
      }
      closeDropdown(o) {
        if (o.isOpen) {
          let {
            content: e,
            arrow: t
          } = o.elements, n = DropdownElementManager.getClassName("showClass"), a = DropdownElementManager.getClassName("openClass");
          DOMUtils.batchUpdate(() => {
            e.classList.remove(n), t && t.classList.remove(a)
          }), o.isOpen = !1, document.removeEventListener("click", o.outsideClickHandler)
        }
      }
      closeAllDropdowns() {
        this.instances.forEach(e => this.closeDropdown(e))
      }
      setupCloseListener(e) {
        var t = e.elements.staticInputButtons;
        t && 0 !== t.length && (t = t[0]) && t.addEventListener("click", () => {
          this.closeDropdown(e)
        })
      }
      highlightSelectedItem(e, t) {
        t && t !== e.elements.staticInputButtons[0] && (e.selectedItem && e.selectedItem !== t && (e.selectedItem.style.backgroundColor = "transparent"), t.style.backgroundColor = "#DCDFE4", e.selectedItem = t, e.hasCustomValue = !1)
      }
      clearAllHighlights(e) {
        var t = e.elements.staticInputButtons;
        t && (t.forEach(e => {
          e.style.backgroundColor = "transparent"
        }), e.selectedItem = null)
      }
      setButtonText(n, a) {
        if (a) {
          let {
            button: e,
            valueText: t
          } = n.elements;
          t ? DOMUtils.batchUpdate(() => {
            t.textContent = a, e.setAttribute("title", a)
          }) : e && this.createValueStructure(n, a)
        }
      }
      createValueStructure(t, n) {
        let a = t.elements.button,
          {
            textElem: o,
            arrow: r
          } = DropdownElementManager.createValueStructure(a, n);
        o && r && (t.elements.valueText = o, t.elements.arrow = r), DOMUtils.batchUpdate(() => {
          var e = DropdownElementManager.getClassName("arrow"),
            e = (o.textContent = n, r.className = e, Array.from(a.childNodes).find(e => e.nodeType === Node.TEXT_NODE && e.textContent.trim())),
            e = e ? e.textContent.trim() : "";
          a.innerHTML = "", e && a.appendChild(document.createTextNode(e)), a.appendChild(o), a.appendChild(r), a.setAttribute("title", n), t.elements.valueText = o, t.elements.arrow = r
        })
      }
      disableButton(e) {
        DOMUtils.batchUpdate(() => {
          e.disabled = !0, e.classList.add("disabled")
        })
      }
      enableButton(e) {
        DOMUtils.batchUpdate(() => {
          e.disabled = !1, e.classList.remove("disabled")
        })
      }
      getLastSelectedRow() {
        return this._lastSelectedRow
      }
      getCustomRowCount() {
        var e = this.getInstancesByType("row");
        return e && 0 !== e.length && (e = e[0]).hasCustomValue ? this.getCustomInputValue(e) : null
      }
      getSelectedRowCount() {
        var e = this.getInstancesByType("row");
        if (!e || 0 === e.length) return 10;
        var e = e[0];
        if (e.hasCustomValue) {
          var t = this.getCustomInputValue(e);
          if (null !== t) return t
        }
        return e.elements.valueText ? (t = e.elements.valueText.textContent.trim(), t = parseInt(t, 10), isNaN(t) ? 10 : t) : !e.selectedItem || (t = e.selectedItem.textContent.trim(), e = parseInt(t, 10), isNaN(e)) ? 10 : e
      }
      setSelectedRowCount(t) {
        if (t = parseInt(t, 10), isNaN(t) || t < 0) return console.warn("Invalid row count provided:", t), !1;
        var e = this.getInstancesByType("row");
        if (!e || 0 === e.length) return console.warn("No row dropdown found to update"), !1;
        var e = e[0],
          n = e.elements,
          {
            staticInputButtons: a,
            customInput: n,
            setButton: o
          } = n;
        this.setButtonText(e, t.toString());
        let r = null;
        if (a && 1 < a.length)
          for (let e = 1; e < a.length; e++) {
            var l = a[e].textContent.trim();
            if (parseInt(l, 10) === t) {
              r = a[e];
              break
            }
          }
        return r ? (e.hasCustomValue && (e.hasCustomValue = !1, this.resetCustomInput(e)), this.highlightSelectedItem(e, r)) : n && o && (this.clearAllHighlights(e), n.value = t.toString(), o.textContent = "Edit", n.disabled = !0, e.isInEditMode = !1, e.hasCustomValue = !0), !0
      }
      hasCustomRowCount() {
        var e = this.getInstancesByType("row");
        return !!(e && 0 < e.length) && !0 === e[0].hasCustomValue
      }
      getCustomInputValue(e) {
        return !e.hasCustomValue || (e = e.elements.valueText, !e) || (e = e.textContent.trim(), e = parseInt(e, 10), isNaN(e)) ? null : e
      }
      setupCustomInput(d) {
        let {
          customInput: a,
          setButton: e
        } = d.elements;
        if (a && e) {
          e.textContent = "Set";
          let n;
          a.addEventListener("input", e => {
            let t = e.target.value;
            "" === t || /^\d*$/.test(t) ? (clearTimeout(n), n = setTimeout(() => {
              var e;
              "" !== t && ((e = parseInt(t, 10)) < 5 ? a.value = "5" : 35 < e && (a.value = "35"))
            }, 300)) : a.value = t.replace(/\D/g, "")
          }), a.addEventListener("blur", () => {
            if ("" !== a.value.trim()) {
              let e = parseInt(a.value, 10);
              isNaN(e) || e < 5 ? e = 5 : 35 < e && (e = 35), a.value = e
            }
          }), d.isInEditMode = !0, e.textContent = "Set", a.disabled = !1, e.addEventListener("click", () => {
            if (d.isInEditMode) {
              let s = a.value.trim(),
                u = parseInt(s, 10);
              if (s && 5 <= u && u <= 35) {
                this.clearAllHighlights(d), e.textContent = "Edit", a.disabled = !0, d.isInEditMode = !1, d.hasCustomValue = !0;
                let n = PaginationModule.getCurrentPage();
                document.dispatchEvent(new CustomEvent("dropdown:rowCountChanged", {
                  bubbles: !0,
                  detail: {
                    rowCount: u,
                    source: "customInput"
                  }
                })), setTimeout(() => {
                  TableDataModule.getTotalCount().then(i => {
                    if (u >= i) DropdownContainerModule.setSelectedRowCount(i), DropdownContainerModule.enableAllResults(i), RowManagerModule.setRowCountWithData(i, !1), PaginationModule.setMaxPage(1);
                    else {
                      var e = DropdownContainerModule.getSelectedRowCount(),
                        e = (n - 1) * e;
                      let a = u;
                      var e = Math.max(1, Math.floor(e / a) + 1),
                        t = PaginationElementManager.getMaxPage().textContent;
                      let o = parseInt(t.match(/\d+/)[0], 10),
                        r = Math.min(e, o),
                        l = ColumnElementManager.getColumnHeaders();
                      l && l.length && TableDataModule.getPageData(r, a, l).then(t => {
                        let n = a;
                        var e;
                        r === o && (e = i - (o - 1) * a, n = e), new Promise(e => {
                          var t = RowManagerModule.setRowCountWithData(n, !1);
                          t instanceof Promise ? t.then(e) : e()
                        }).then(() => {
                          var e = RowElementManager.getAllRows();
                          PaginationModule.goToPage(r), DropdownContainerModule.disableAllResults(), DropdownContainerModule.setSelectedRowCount(u), DataApplierModule.applyDataToRows(e, t, l), this.setButtonText(d, s), this._lastSelectedRow = s
                        })
                      }).catch(e => {
                        console.error("Error fetching page data after custom row count change:", e)
                      })
                    }
                  }).catch(e => {
                    console.error("Error fetching total count:", e)
                  })
                }, 50)
              }
            } else e.textContent = "Set", a.disabled = !1, d.isInEditMode = !0
          })
        }
      }
      resetCustomInput(e) {
        let {
          customInput: t,
          setButton: n
        } = e.elements;
        t && n && (DOMUtils.batchUpdate(() => {
          n.textContent = "Set", t.disabled = !1, t.value = ""
        }), e.isInEditMode = !0, e.hasCustomValue = !1)
      }
      enableAllResults(e) {
        SearchElementManager.getSearchContainer().textContent = `Showing ${e} ` + (1 === e ? "item" : "items")
      }
      disableAllResults() {
        SearchElementManager.getSearchContainer().textContent = "", DropdownContainerModule.setSelectedRowCount(this._lastSelectedRow)
      }
      setupRowDropdown(t) {
        var e = t.elements;
        let {
          staticInputButtons: n,
          content: a
        } = e;
        this.setupCloseListener(t);
        var o = n[1];
        o && e.valueText && (this.setButtonText(t, o.textContent.trim()), this._lastSelectedRow = o.textContent.trim(), this.highlightSelectedItem(t, o));
        let r = DropdownElementManager.getClassName("staticInput");
        a.addEventListener("click", e => {
          e = e.target.closest("." + r);
          if (e && e !== n[0]) {
            let i = e.textContent.trim();
            i && parseInt(i, 10) !== RowElementManager.getRowCount() && (t.hasCustomValue && (t.hasCustomValue = !1, this.resetCustomInput(t)), this.highlightSelectedItem(t, e), this._lastSelectedRow = i, TableDataModule.getTotalCount().then(l => {
              let t = PaginationModule.getCurrentPage();
              var e;
              i > l ? (DropdownContainerModule.setSelectedRowCount(l), DropdownContainerModule.enableAllResults(l), RowManagerModule.setRowCountWithData(l, t), PaginationModule.setMaxPage(1)) : (e = parseInt(i, 10), isNaN(e) || (document.dispatchEvent(new CustomEvent("dropdown:rowCountChanged", {
                bubbles: !0,
                detail: {
                  rowCount: e,
                  source: "staticInput"
                }
              })), setTimeout(() => {
                var e = PaginationElementManager.getMaxPage().textContent;
                let n = parseInt(e.match(/\d+/)[0], 10);
                e = DropdownContainerModule.getSelectedRowCount(), e = (t - 1) * e;
                let a = parseInt(i, 10);
                e = Math.max(1, Math.floor(e / a) + 1);
                let o = Math.min(e, n),
                  r = ColumnElementManager.getColumnHeaders();
                r && r.length && TableDataModule.getPageData(o, a, r).then(e => {
                  o === n ? (t = l - (n - 1) * a, RowManagerModule.setRowCountWithData(t, o)) : (console.log("setting here! with", i), RowManagerModule.setRowCountWithData(i, o));
                  var t = RowElementManager.getAllRows();
                  PaginationModule.goToPage(o), DropdownContainerModule.disableAllResults(), DataApplierModule.applyDataToRows(t, e, r)
                }).catch(e => {
                  console.error("Error fetching page data after row count change:", e)
                })
              }, 50)))
            }).catch(e => {
              console.error("Error fetching total count:", e)
            }))
          }
        }), document.addEventListener("search:cleared", function(e) {
          this.disableAllResults()
        }.bind(this)), this.setupCustomInput(t)
      }
      setupColumnDropdown(o) {
        var e = o.elements;
        let {
          staticInputButtons: t,
          content: n
        } = e;
        this.setupCloseListener(o);
        if (this.initializeColumnCheckboxes(o), t && t.length) {
          let a = ColumnManagerModule.getColumnHeaders();
          t.forEach(e => {
            var t = e.textContent.trim(),
              t = a.includes(t),
              n = e.classList.contains("disabled");
            t && !n ? this.disableButton(e) : !t && n && this.enableButton(e)
          })
        }
        this.setupColumnCheckboxHandlers(o), document.addEventListener("columnTitle:changed", e => {
          let {
            oldTitle: n,
            newTitle: a
          } = e.detail;
          var e = DropdownElementManager.getClassName("checkboxItem"),
            t = o.elements.checkboxList;
          t && t.querySelectorAll("." + e).forEach(e => {
            var t = e.querySelector('input[type="checkbox"]'),
              e = e.querySelector("label");
            t && e && ((e = e.textContent.trim()) === n && (t.checked = !1), e === a) && (t.checked = !0)
          })
        });
        let a = DropdownElementManager.getClassName("staticInput");
        n.addEventListener("click", e => {
          e = e.target.closest("." + a);
          e && e !== t[0] && e.textContent.trim()
        })
      }
      initializeColumnCheckboxes(e) {
        e = e.elements.checkboxList;
        if (e) {
          let n = ColumnManagerModule.getColumnHeaders();
          var t = DropdownElementManager.getClassName("checkboxItem"),
            e = e.querySelectorAll("." + t);
          e && 0 !== e.length && e.forEach(e => {
            var t = e.querySelector('input[type="checkbox"]'),
              e = e.querySelector("label");
            t && e && (e = e.textContent.trim(), e = n.includes(e), t.checked !== e) && (t.checked = e)
          })
        }
      }
      setupColumnCheckboxHandlers(r) {
        let t = r.elements.checkboxList;
        if (t) {
          let e = DropdownElementManager.getClassName("checkboxItem");
          var n = t.querySelectorAll("." + e);
          n && 0 !== n.length && (r._pendingColumnOperations || (r._pendingColumnOperations = new Set), t._changeHandler && t.removeEventListener("change", t._changeHandler), t._changeHandler = function(a) {
            if ("checkbox" === a.target.type) {
              let n = a.target.closest("." + e);
              if (n) {
                let t = a.target;
                var o = n.querySelector("label");
                if (o) {
                  let e = o.textContent.trim();
                  var o = t.checked;
                  r._pendingColumnOperations.has(e) ? (a.preventDefault(), t.checked = !o) : (r._pendingColumnOperations.add(e), t.disabled = !0, n.style.opacity = "0.7", o ? (a = ColumnManagerModule.addColumns(1, [e]), o = ColumnElementManager.getColumnTitleIndex(e), document.dispatchEvent(new CustomEvent("columnManager:columnAdded", {
                    bubbles: !0,
                    detail: {
                      column: e,
                      columnIndex: o,
                      page: PaginationModule.getCurrentPage(),
                      rowCount: RowManagerModule.getRowCount()
                    }
                  })), a instanceof Promise ? a.finally(() => {
                    t.disabled = !1, n.style.opacity = "1", r._pendingColumnOperations.delete(e)
                  }) : setTimeout(() => {
                    t.disabled = !1, n.style.opacity = "1", r._pendingColumnOperations.delete(e)
                  }, 300)) : (o = ColumnManagerModule.getColumnHeaders()).length <= 3 && o.includes(e) ? (setTimeout(() => {
                    t.checked = !0, t.disabled = !1, n.style.opacity = "1", r._pendingColumnOperations.delete(e)
                  }, 0), console.warn("At least three columns must remain visible")) : -1 !== (a = o.indexOf(e)) && ((o = ColumnManagerModule.deleteColumn(a, e)) instanceof Promise ? o.finally(() => {
                    t.disabled = !1, n.style.opacity = "1", r._pendingColumnOperations.delete(e)
                  }) : setTimeout(() => {
                    t.disabled = !1, n.style.opacity = "1", r._pendingColumnOperations.delete(e)
                  }, 300)))
                }
              }
            }
          }, t.addEventListener("change", t._changeHandler), document.addEventListener("click", e => {
            t.contains(e.target) || r.elements.button.contains(e.target) || !r.isOpen || r._pendingColumnOperations.clear()
          }))
        }
      }
      setupSortDropdown(o) {
        var {} = o;
        let {
          staticInputButtons: r,
          content: e
        } = o.elements, l = DropdownElementManager.getClassName("staticInput"), i = (this.setupCloseListener(o), o.id = `dropdown-${Date.now()}-` + Math.floor(1e3 * Math.random()), o.activeSortButton = null, o.activeSortPlaceholder = null, o.activeSortDirection = null, SortIndicatorElementManager.getInstance() || SortIndicatorElementManager.initialize(document.body), SortIndicatorModule.getInstance() || SortIndicatorModule.initialize(), () => {
          o.activeSortPlaceholder && (SortIndicatorModule.unregisterContainer(o.activeSortPlaceholder), o.activeSortPlaceholder.parentNode && o.activeSortPlaceholder.parentNode.removeChild(o.activeSortPlaceholder), o.activeSortPlaceholder = null, o.activeSortButton = null, o.activeSortDirection = null)
        });
        e.addEventListener("click", t => {
          let n = t.target.closest("." + l);
          var t = TableDataModule.isSearchModeActive(),
            a = TableDataModule.isSortModeActive();
          if (n)
            if (n === r[0]) this.closeDropdown(o);
            else {
              if (n === r[1]) return t || !a ? void 0 : (SortIndicatorModule.clearAllSortIndicators(), void i());
              var e, t = n.textContent.trim(),
                a = Array.from(r).indexOf(n) - 1;
              if (n === o.activeSortButton) e = "up" === o.activeSortDirection ? "down" : "up", o.activeSortDirection = e, SortIndicatorModule.handleSortIndicatorClick(o.activeSortPlaceholder, e);
              else {
                i();
                let e = SortIndicatorElementManager.createSortPlaceholder();
                e.className = "sort-indicator-placeholder", DOMUtils.batchUpdate(() => {
                  n.appendChild(e)
                }), o.activeSortButton = n, o.activeSortPlaceholder = e, o.activeSortDirection = "up", SortIndicatorModule.registerContainer(e, a, {
                  source: "dropdown",
                  columnName: t,
                  parentDropdownId: o.id
                }), SortIndicatorModule.handleSortIndicatorClick(e, "up")
              }
            }
        }), document.addEventListener("sortIndicator:sort", e => {
          e = e.detail.source;
          o.isOpen && "column" === e && (i(), this.closeDropdown(o))
        })
      }
      setupSearchDropdown(n) {
        var e = n.elements;
        let {
          staticInputButtons: a,
          content: t,
          searchBar: o
        } = e, r = (this.setupCloseListener(n), a && 1 < a.length && (this.highlightSelectedItem(n, a[1]), o) && SearchBarModule.updateSearchPlaceholder(o, a[1].textContent), DropdownElementManager.getClassName("staticInput"));
        t.addEventListener("click", e => {
          var t, e = e.target.closest("." + r);
          e && e !== a[0] && (t = e.textContent.trim()) && (this.highlightSelectedItem(n, e), o && SearchBarModule.updateSearchPlaceholder(o, t), "" !== SearchBarModule.getCurrentSearchTerm()) && SearchBarModule.clearSearch()
        })
      }
      setupColumnTitleDropdown(i) {
        let r = this.constructor.SUPPORTED_COLUMNS;
        this.setupCloseListener(i);
        var e = i.elements.button.id;
        this.setButtonText(i, e), ColumnElementManager.getColumnInsertionPoint().addEventListener("columnManager:columnsAdded", e => {
          i.lastColumnAdded = e.detail?.column || null, i.needsRefresh = !0
        }), i.elements.button.addEventListener("click", () => {
          let {
            content: n,
            staticInputButtons: e
          } = i.elements, t = (i.availableColumns = ColumnElementManager.getColumnHeaders(!0), i.elements.button.querySelector("span").textContent);
          i.staticInputOptions = r.filter(e => e !== t), n.innerHTML = "";
          var a = DropdownElementManager.createCloseButton("Change To");
          n.appendChild(a), e && e.filter(e => !e.classList.contains(DropdownElementManager.getClassName("closeButton")) && !e.classList.contains(DropdownElementManager.getClassName("titleElement"))).forEach(e => n.appendChild(e));
          let o = [DropdownElementManager.getClassName("staticInput"), DropdownElementManager.getClassName("dropdownItem")];
          i.staticInputOptions.forEach(e => {
            var t = document.createElement("div");
            t.classList.add(...o), t.textContent = e, n.appendChild(t)
          }), i.needsRefresh = !1
        });
        let s = DropdownElementManager.getClassName("staticInput");
        i.elements.content.addEventListener("click", e => {
          var t, n, a, o, r, l, e = e.target.closest("." + s);
          e && (e.classList.contains(DropdownElementManager.getClassName("closeButton")) || (e = e.textContent, t = i.elements.button.querySelector("span").textContent, a = (n = ColumnElementManager.getColumnHeaders()).indexOf(t), -1 !== (o = n.indexOf(e)) ? (this.setButtonText(i, e), i.elements.button.id = e, o < (l = ColumnElementManager.getAllColumns()).length && (l = l[o].querySelector("." + DropdownElementManager.getClassName("dropdownContainer"))) && (l = l.querySelector("." + ColumnElementManager.getClassName("columnTitle"))) && ((r = l.querySelector("span")) && (r.textContent = t), l.id = t, l.title = t), [...n], ColumnElementManager.swapColumnTitles(t, e), document.dispatchEvent(new CustomEvent("columnManager:columnSwapped", {
            bubbles: !0,
            detail: {
              column1: t,
              column2: e,
              index1: a,
              index2: o
            }
          }))) : (ColumnElementManager.addColumnTitleAtIndex(t, a, e), this.setButtonText(i, e), r = TableDataModule.getCurrentPage() || 1, l = RowManagerModule.getRowCount(), document.dispatchEvent(new CustomEvent("columnManager:columnAdded", {
            bubbles: !0,
            detail: {
              column: e,
              columnIndex: a,
              page: r,
              rowCount: l
            }
          })), document.dispatchEvent(new CustomEvent("columnTitle:changed", {
            bubbles: !0,
            detail: {
              oldTitle: t,
              newTitle: e,
              columnIndex: a
            }
          })))), this.closeDropdown(i))
        })
      }
    }
    return {
      initialize(e) {
        try {
          return (t = t || new n).initializeDropdowns(e), this
        } catch (e) {
          return console.error("Error initializing dropdowns:", e), null
        }
      },
      getInstance: () => t,
      getDropdownInstance: e => t?.getDropdownInstance(e) || null,
      getInstancesByType: e => t?.getInstancesByType(e) || [],
      getCustomRowCount: () => t?.getCustomRowCount() || null,
      getSelectedRowCount: () => t?.getSelectedRowCount() || 10,
      hasCustomRowCount: () => t?.hasCustomRowCount() || !1,
      closeAllDropdowns: () => t?.closeAllDropdowns(),
      enableAllResults: e => t?.enableAllResults(e),
      disableAllResults: () => t?.disableAllResults(),
      setSelectedRowCount: e => t?.setSelectedRowCount(e) || !1,
      getLastSelectedRow: () => t?.getLastSelectedRow()
    }
  })(),
  PaginationModule = (() => {
    let s = 1,
      u = 1,
      d = 10,
      c = new Map,
      m = null,
      g = null;
    async function e() {
      try {
        d = DropdownContainerModule.getSelectedRowCount();
        var e = await TableDataModule.getTotalCount(),
          t = Math.max(1, Math.ceil(e / d));
        t !== u && (u = t, a()), s > u ? o(u) : h()
      } catch (e) {
        console.error("Error updating pagination:", e), u = 1, a(), 1 !== s && o(1)
      }
    }

    function t() {
      PaginationElementManager.setCurrentPageText(s)
    }

    function a() {
      PaginationElementManager.setMaxPageText(u)
    }

    function h() {
      PaginationElementManager.updateButtonStates(s, u)
    }

    function o(a, o) {
      if ((a = Math.max(1, Math.min(a, u))) !== s) {
        var r = s;
        s = a, t(), h();
        {
          var l = r;
          var i = s;
          a = o;
          g && g.abort(), g = new AbortController;
          let e = RowManagerModule.getAllRows(),
            t = ColumnElementManager.getColumnHeaders(),
            n = Date.now();
          c.set(i, n), m = i, t && e ? a || requestAnimationFrame(() => {
            c.get(i) === n && document.dispatchEvent(new CustomEvent("pagination:pageChanged", {
              bubbles: !0,
              detail: {
                previousPage: l,
                page: i,
                rows: e,
                columns: t,
                rowsPerPage: d,
                signal: g.signal,
                timestamp: n
              }
            }))
          }) : console.error("Missing data - cannot dispatch page change event")
        }
      } else h();
      return Promise.resolve()
    }

    function n() {
      var e = {
        next: PaginationElementManager.getNext(),
        prev: PaginationElementManager.getPrevious(),
        fastForward: PaginationElementManager.getFastForward(),
        fastBack: PaginationElementManager.getFastBackward()
      };
      e.next && e.next.addEventListener("click", function(e) {
        this.classList.contains("disabled") || (e.preventDefault(), o(s + 1))
      }), e.prev && e.prev.addEventListener("click", function(e) {
        this.classList.contains("disabled") || (e.preventDefault(), o(s - 1))
      }), e.fastForward && e.fastForward.addEventListener("click", function(e) {
        this.classList.contains("disabled") || (e.preventDefault(), o(u))
      }), e.fastBack && e.fastBack.addEventListener("click", function(e) {
        this.classList.contains("disabled") || (e.preventDefault(), o(1))
      }), document.addEventListener("dataApplier:pageDataApplied", function(e) {
        e.detail?.page && c.delete(e.detail.page)
      }), document.addEventListener("sort:applied", e => {
        e.detail && 1 !== s && o(1)
      }), document.addEventListener("sort:cleared", e => {
        1 !== s && o(1)
      }), document.addEventListener("search:performed", e => {
        1 !== s && o(1, !0)
      }), document.addEventListener("search:cleared", e => {
        1 !== s && o(1, !0)
      }), document.addEventListener("dropdown:rowCountChanged", async e => {
        if (e.detail?.rowCount) {
          d = e.detail.rowCount;
          try {
            var t = await TableDataModule.getTotalCount();
            u = Math.max(1, Math.ceil(t / d)), a(), s > u ? o(u) : (h(), document.dispatchEvent(new CustomEvent("pagination:rowCountUpdated", {
              bubbles: !0,
              detail: {
                page: s,
                rowsPerPage: d
              }
            })))
          } catch (e) {
            console.error("Error updating pagination after row count change:", e)
          }
        }
      }), document.addEventListener("pagination:stateUpdated", e => {
        var t, n;
        e.detail && ({
          page: t,
          totalPages: e,
          totalCount: n
        } = e.detail, void 0 !== e ? (u = e, a(), 1 === u ? (DropdownContainerModule.enableAllResults(n), DropdownContainerModule.setSelectedRowCount(n)) : DropdownContainerModule.disableAllResults()) : void 0 !== n && (e = DropdownContainerModule?.getSelectedRowCount?.() || d, (n = Math.max(1, Math.ceil(n / e))) !== u) && (u = n, a()), h(), s > u) && o(u)
      })
    }
    return {
      initialize: async function() {
        DropdownContainerModule?.getSelectedRowCount && (d = DropdownContainerModule.getSelectedRowCount()), await e(), s = 1, t(), n(), setTimeout(() => {
          e()
        }, 100)
      },
      goToPage: o,
      updateMaxPages: e,
      updateButtonStates: h,
      setMaxPage: function(e) {
        return (e = Math.max(1, Math.floor(e))) !== u && (u = e, a(), s > u ? o(u) : h(), document.dispatchEvent(new CustomEvent("pagination:maxPageChanged", {
          bubbles: !0,
          detail: {
            totalPages: u
          }
        }))), u
      },
      getCurrentPage: () => s,
      getTotalPages: () => u,
      getRowsPerPage: () => d,
      getPendingNavigationCount: () => c.size
    }
  })(),
  RowManagerModule = (() => {
    let n = null;
    class e {
      constructor() {
        if (PerformanceTracker.start("rowManagerInit"), !RowElementManager.getInstance()) throw new Error("RowElementManager must be initialized before RowManagerModule");
        if (!ColumnElementManager.getInstance()) throw new Error("ColumnElementManager must be initialized before RowManagerModule");
        if (this.rowInsertionPoint = RowElementManager.getRowInsertionPoint(), !this.rowInsertionPoint) throw new Error("Row insertion point not found");
        this.rowCount = RowElementManager.getRowCount(), PerformanceTracker.end("rowManagerInit")
      }
      createRow() {
        PerformanceTracker.start("createRow");
        var e = ColumnElementManager.getColumnCount(),
          e = RowElementManager.createRowTemplate(e);
        return PerformanceTracker.end("createRow"), e
      }
      addRows(t, e = 0) {
        if (PerformanceTracker.start("addRows"), (t = this._validateCount(t)) <= 0) return PerformanceTracker.end("addRows"), [];
        var n = [];
        for (let e = 0; e < t; e++) n.push(this.createRow());
        return RowElementManager.appendRows(n, this.rowInsertionPoint), this.rowCount += t, this._handleRowAddedNotification(n, t), PerformanceTracker.end("addRows"), n
      }
      removeRows(e) {
        var t;
        PerformanceTracker.start("removeRows"), (e = this._validateCount(e)) <= 0 || (e = Math.min(e, this.rowCount), t = RowElementManager.removeLastNRows(e, this.rowInsertionPoint), this.rowCount -= e, this._dispatchRowEvent("rowsRemoved", {
          count: e,
          rows: t
        })), PerformanceTracker.end("removeRows")
      }
      setRowCount(e, t) {
        PerformanceTracker.start("setRowCount"), (e = this._validateCount(e)) !== this.rowCount && (e > this.rowCount ? this.addRows(e - this.rowCount, t) : this.removeRows(this.rowCount - e)), PerformanceTracker.end("setRowCount")
      }
      async setRowCountWithData(e, t) {
        return PerformanceTracker.start("setRowCountWithData"), (e = this._validateCount(e)) === this.rowCount ? (PerformanceTracker.end("setRowCountWithData"), []) : (this.setRowCount(e, t), PerformanceTracker.end("setRowCountWithData"), e > this.rowCount ? RowElementManager.getLastNRows(e - this.rowCount) : [])
      }
      deleteAllRows() {
        PerformanceTracker.start("deleteAllRows"), 0 < this.rowCount && this.removeRows(this.rowCount), PerformanceTracker.end("deleteAllRows")
      }
      clearRowData() {
        PerformanceTracker.start("clearRowData");
        var e = this.getAllRows();
        return RowElementManager.clearRowsContent(e), PerformanceTracker.end("clearRowData"), e
      }
      closeAllExpandedRows() {
        PerformanceTracker.start("closeAllExpandedRows"), this.getAllRows().forEach(e => {
          "true" === e.dataset.expanded && RowElementManager.collapseExpandedRow(e)
        }), PerformanceTracker.end("closeAllExpandedRows")
      }
      getRowCount() {
        return this.rowCount
      }
      getAllRows() {
        return RowElementManager.getAllRows(!0)
      }
      getRowByIndex(e) {
        return RowElementManager.getRowByIndex(e, !0)
      }
      _validateCount(e) {
        return e = parseInt(e, 10) || 0, Math.max(0, e)
      }
      _handleRowAddedNotification(t, n) {
        var e = PaginationElementManager.getMaxPage().textContent;
        let a = parseInt(e.match(/\d+/)[0], 10),
          o = parseInt(PaginationElementManager.getCurrentPage().textContent, 10);
        TableDataModule.getTotalCount().then(e => {
          e -= (a - 1) * DropdownContainerModule.getSelectedRowCount();
          a === o && 1 !== a || (console.log("RowElementManager.getRowCount() is", RowElementManager.getRowCount()), console.log("RowElementManager.getRowCount() - count is", RowElementManager.getRowCount() - n), console.log("itemsRemaining is", e), this._dispatchRowEvent("rowsAdded", {
            count: n,
            rows: t
          }))
        })
      }
      _dispatchRowEvent(e, t) {
        this.rowInsertionPoint.dispatchEvent(new CustomEvent("rowManager:" + e, {
          bubbles: !0,
          detail: t
        }))
      }
    }
    return {
      initialize() {
        PerformanceTracker.start("rowManagerInitialize");
        try {
          n = n || new e
        } catch (e) {
          throw console.error("Error initializing RowManager:", e), PerformanceTracker.end("rowManagerInitialize"), e
        }
        return PerformanceTracker.end("rowManagerInitialize"), n
      },
      getInstance: () => n,
      createRow: () => n?.createRow() || null,
      addRows: e => n?.addRows(e) || [],
      removeRows: e => n?.removeRows(e),
      setRowCount: (e, t) => n?.setRowCount(e, t),
      setRowCountWithData: (e, t) => n?.setRowCountWithData(e, t) || Promise.resolve([]),
      deleteAllRows: () => n?.deleteAllRows(),
      clearRowData: () => n?.clearRowData(),
      closeAllExpandedRows: () => n?.closeAllExpandedRows(),
      getRowCount: () => n?.getRowCount() || 0,
      getAllRows: () => n?.getAllRows() || [],
      getRowByIndex: e => n?.getRowByIndex(e) || null
    }
  })(),
  SearchBarModule = (() => {
    let a = {},
      n = "",
      o = null,
      r = 300;

    function l() {
      var e, t, n = a.input.value.trim();
      0 === n.length ? document.dispatchEvent(new CustomEvent("search:cleared", {
        bubbles: !0
      })) : (e = (e = a.input.placeholder || "") && e.match(/Search by (.+)/i)?.[1]?.trim() || "", t = DropdownContainerModule?.getSelectedRowCount?.() || RowManagerModule.getRowCount(), document.dispatchEvent(new CustomEvent("search:performed", {
        bubbles: !0,
        detail: {
          term: n,
          type: e,
          page: PaginationModule.getCurrentPage(),
          rowCount: t
        }
      })))
    }

    function t() {
      a.input && a.input.addEventListener("input", () => {
        var e = 0 === a.input.value.length;
        e = !e, a.clear && SearchElementManager.updateClearButtonVisibility(a.clear, e), SortIndicatorModule.clearAllSortIndicatorsReset(), clearTimeout(o), o = setTimeout(l, r)
      })
    }

    function i() {
      a.input && (SearchElementManager.clearSearchInput(a.input, a.clear, a.container), clearTimeout(o), o = null, document.dispatchEvent(new CustomEvent("search:cleared", {
        bubbles: !0
      })))
    }

    function e(e) {
      try {
        return (SearchElementManager.getInstance() || SearchElementManager.initialize(e), a.input = SearchElementManager.getSearchInput(!1), a.clear = SearchElementManager.getClearIcon(!1), a.container = SearchElementManager.getSearchContainer(!1), a.input && a.clear) ? (t(), a.clear && a.clear.addEventListener("click", () => {
          i(), a.input.focus()
        }), this) : (console.warn("SearchBarModule: Required elements not found"), null)
      } catch (e) {
        return console.error("SearchBarModule: Initialization error:", e), null
      }
    }
    return {
      initialize: e,
      updateSearchPlaceholder(e, t) {
        t && (e = e || a.input) && (SearchElementManager.updatePlaceholder(e, "Search by " + t), n = t, 0 < e.value.trim().length) && (clearTimeout(o), o = setTimeout(l, r))
      },
      clearSearch() {
        i()
      },
      getCurrentSearchType: () => n,
      getCurrentSearchTerm: () => a.input?.value.trim() || "",
      isSearchActive: () => 0 < a.input?.value.trim().length || !1,
      getSearchInput: () => a.input,
      getSearchContainer: () => a.container,
      getClearIcon: () => a.clear,
      refreshElementCache: e
    }
  })(),
  SortIndicatorModule = (() => {
    let a = null,
      r = new Map,
      i = {
        container: null,
        element: null,
        direction: null,
        columnIndex: null,
        source: null
      };
    class e {
      constructor() {}
      registerContainer(e, t, n = {}) {
        if (!e) return null;
        if (r.has(e)) return r.get(e);
        let a = e.querySelector("." + SortIndicatorElementManager.getSortIndicatorsClass()),
          o = !1;
        a || (a = SortIndicatorElementManager.createSortIndicatorTemplate(), e.appendChild(a), o = !0);
        t = {
          container: e,
          element: a,
          columnIndex: t,
          isActive: !1,
          direction: null,
          source: n.source || "column",
          columnName: n.columnName || "",
          ...n
        };
        return r.set(e, t), o && this.setupSortIndicatorEvents(t), t
      }
      unregisterContainer(e) {
        e && r.has(e) && (r.get(e), i.container === e && (i = {
          container: null,
          element: null,
          direction: null,
          columnIndex: null,
          source: null
        }), r.delete(e))
      }
      setupSortIndicatorEvents(t) {
        var e = t.element,
          n = e.querySelector("." + SortIndicatorElementManager.getTriangleUpClass()),
          e = e.querySelector("." + SortIndicatorElementManager.getTriangleDownClass());
        n && e && (n.addEventListener("click", e => {
          this.handleSortIndicatorClick(t, "up")
        }), e.addEventListener("click", e => {
          this.handleSortIndicatorClick(t, "down")
        }))
      }
      registerContainerEvents(e, n) {
        if (e && n) {
          let t = r.get(n);
          t && (e._sortClickHandler && e.removeEventListener("click", e._sortClickHandler), e._sortClickHandler = e => {
            e.target.closest("." + SortIndicatorElementManager.getSortIndicatorsClass()) || (e = (e = t.direction) && "up" === e ? "down" : "up", this.handleSortIndicatorClick(t, e))
          }, e.addEventListener("click", e._sortClickHandler))
        }
      }
      handleSortIndicatorClick(e, t) {
        var {
          container: n,
          element: a,
          columnIndex: o,
          source: r,
          columnName: l
        } = e;
        i.container === n && i.direction === t ? this.clearAllSortIndicators() : (this.clearAllSortIndicators(), SearchBarModule.clearSearch(), SortIndicatorElementManager.setTriangleState(a, t, !0), i = {
          container: n,
          element: a,
          direction: t,
          columnIndex: o,
          source: r,
          columnName: l
        }, e.isActive = !0, this.dispatchSortEvent(n, o, e.direction = t, r, l))
      }
      clearAllSortIndicatorsReset() {
        let t = [];
        r.forEach(e => {
          "dropdown" === e.source ? (t.push(e.container), SortIndicatorElementManager.removeIndicator(e.element)) : SortIndicatorElementManager.clearIndicator(e.element), e.isActive = !1, e.direction = null
        }), t.forEach(e => {
          r.delete(e)
        }), i = {
          container: null,
          element: null,
          direction: null,
          columnIndex: null,
          source: null
        }
      }
      clearAllSortIndicators() {
        r.forEach(e => {
          SortIndicatorElementManager.clearIndicator(e.element), e.isActive = !1, e.direction = null
        }), i = {
          container: null,
          element: null,
          direction: null,
          columnIndex: null,
          source: null
        }, document.dispatchEvent(new CustomEvent("sort:cleared", {
          bubbles: !0
        }))
      }
      dispatchSortEvent(e, t, n, a, o) {
        document.dispatchEvent(new CustomEvent("sortIndicator:sort", {
          bubbles: !0,
          detail: {
            container: e,
            columnIndex: t,
            direction: n,
            source: a,
            columnName: o || e.textContent.trim()
          }
        }))
      }
      getActiveSort() {
        return {
          ...i
        }
      }
      getAllIndicators() {
        return new Map(r)
      }
    }
    return {
      initialize() {
        return a = a || new e
      },
      getInstance() {
        return a
      },
      registerContainer(e, t, n) {
        return a?.registerContainer(e, t, n) || null
      },
      registerContainerEvents(e, t) {
        return a?.registerContainerEvents(e, t)
      },
      handleSortIndicatorClick(e, t) {
        e = r.get(e);
        e && a?.handleSortIndicatorClick(e, t)
      },
      clearAllSortIndicators() {
        return a?.clearAllSortIndicators()
      },
      clearAllSortIndicatorsReset() {
        return a?.clearAllSortIndicatorsReset()
      },
      getActiveSort() {
        return a?.getActiveSort() || {
          container: null,
          element: null,
          direction: null,
          columnIndex: null,
          source: null
        }
      },
      unregisterContainer(e) {
        return a?.unregisterContainer(e)
      },
      getAllIndicators() {
        return a?.getAllIndicators() || new Map
      }
    }
  })(),
  TableDataModule = (() => {
    let s = {
        mode: "regular",
        search: {
          term: "",
          type: ""
        },
        sort: {
          column: "",
          direction: ""
        },
        currentPage: 1,
        isBusy: !1
      },
      u = (e = 10) => DropdownContainerModule?.getSelectedRowCount?.() || e,
      l = () => ColumnElementManager.getColumnHeaders() || [],
      d = () => RowManagerModule.getRowCount();

    function c(e, t) {
      document.dispatchEvent(new CustomEvent("tableData:" + e, {
        bubbles: !0,
        detail: t
      }))
    }

    function m(e, t, n) {
      document.dispatchEvent(new CustomEvent("pagination:stateUpdated", {
        bubbles: !0,
        detail: {
          page: e,
          totalPages: Math.max(1, Math.ceil(t / n)),
          totalCount: t
        }
      }))
    }
    async function r(e, t = {}) {
      t = Object.entries(t).flatMap(([e, t]) => "columns" === e ? (Array.isArray(t) ? t : [t]).map(e => "columns=" + encodeURIComponent(e)) : [e + "=" + encodeURIComponent(t)]).join("&"), e = await fetch("/ProductionHistory/" + e + (t ? "?" + t : ""), {
        headers: {
          Connection: "keep-alive"
        }
      });
      if (e.ok) return e.json();
      throw new Error("HTTP error " + e.status)
    }
    async function g(e) {
      var {
        page: e,
        rowsPerPage: t,
        columns: n
      } = e;
      let a, o = {
        page: e,
        rowsPerPage: t,
        columns: n
      };
      return "search" === s.mode && s.search.term ? (a = "Search", o.term = s.search.term, o.type = s.search.type) : "sort" === s.mode && s.sort.column ? (a = "SortedPageData", o.sortColumn = s.sort.column, o.sortDirection = s.sort.direction) : a = "GetPageData", r(a, o)
    }
    async function h() {
      return "search" === s.mode && s.search.term ? r("SearchCount", {
        term: s.search.term,
        type: s.search.type
      }) : r("GetTotalCount")
    }
    async function i(e, t, n) {
      let a, o = {
        startIndex: t,
        count: n,
        columns: e
      };
      return "search" === s.mode && s.search.term ? (a = "SearchRange", o.term = s.search.term, o.type = s.search.type) : "sort" === s.mode && s.sort.column ? (a = "SortedRangeData", o.sortColumn = s.sort.column, o.sortDirection = s.sort.direction) : a = "GetRangeJobData", r(a, o)
    }

    function C(e, t) {
      s.mode = "search", s.search = {
        term: e,
        type: t
      }, s.sort = {
        column: "",
        direction: ""
      }
    }

    function p(e, t) {
      s.mode = "sort", s.sort = {
        column: e,
        direction: t
      }, s.search = {
        term: "",
        type: ""
      }
    }

    function e() {
      s.mode = "regular", s.search = {
        term: "",
        type: ""
      }, s.sort = {
        column: "",
        direction: ""
      }
    }
    async function o() {
      return e(), r("GetTotalCount")
    }
    async function w() {
      return e(), r("GetTotalCount")
    }
    let t = {
      async rowsAdded(e) {
        if (!s.isBusy) {
          var {
            count: e,
            rows: t
          } = e.detail;
          if (t?.length && e) {
            var n = l();
            if (n.length) {
              s.isBusy = !0;
              try {
                var a = d() - e;
                c("rowDataFetched", {
                  rows: t,
                  data: await i(n, (s.currentPage - 1) * a + a, e),
                  columns: n,
                  currentPage: s.currentPage,
                  previousRowCount: a,
                  addedRowCount: e
                })
              } finally {
                s.isBusy = !1
              }
            }
          }
        }
      },
      async pageChanged(e) {
        if (!s.isBusy) {
          var {
            page: e,
            rows: t,
            columns: n,
            rowsPerPage: a
          } = e.detail;
          if (n?.length) {
            s.isBusy = !0;
            try {
              s.currentPage = e;
              var o = await h(),
                r = u(a || d()),
                l = (e - 1) * r,
                i = Math.min(r, o - l);
              o <= l ? c("pageOutOfBounds", {
                currentPage: e,
                maxValidPage: Math.max(1, Math.ceil(o / r)),
                totalCount: o,
                rowsPerPage: r
              }) : (c("pageDataFetched", {
                page: e,
                rowCount: i,
                totalCount: o,
                rows: t,
                data: await g({
                  page: e,
                  rowsPerPage: r,
                  columns: n
                }),
                columns: n,
                currentRowCount: d(),
                needsRowUpdate: d() !== i
              }), m(e, o, r))
            } catch (e) {
              console.error("Error during page change:", e)
            } finally {
              s.isBusy = !1
            }
          }
        }
      },
      async columnAdded(e) {
        if (!s.isBusy) {
          var {
            column: e,
            page: t,
            rowCount: n,
            columnIndex: a
          } = e.detail;
          if (e) {
            s.isBusy = !0;
            try {
              var o = (t - 1) * n;
              c("columnDataFetched", {
                column: e,
                columnIndex: a,
                data: await i([e], o, n),
                page: t,
                rowCount: n,
                startIndex: o
              })
            } finally {
              s.isBusy = !1
            }
          }
        }
      },
      async searchPerformed(e) {
        if (!s.isBusy) {
          var {
            term: e,
            type: t
          } = e.detail;
          if (e && t) {
            s.isBusy = !0;
            try {
              C(e, t);
              var n = l(),
                a = await h(),
                o = (s.currentPage = 1, DropdownContainerModule.getLastSelectedRow()),
                r = Math.min(o, a);
              c("searchDataFetched", {
                term: e,
                type: t,
                page: 1,
                rowCount: r,
                totalResults: a,
                columns: n,
                data: await g({
                  page: 1,
                  rowsPerPage: r,
                  columns: n
                }),
                currentRowCount: d(),
                needsRowUpdate: d() !== r
              }), m(1, a, o)
            } finally {
              s.isBusy = !1
            }
          }
        }
      },
      async searchCleared() {
        if (!s.isBusy) {
          s.isBusy = !0;
          try {
            var e = await o().catch(() => h()),
              t = (s.currentPage = 1, l()),
              n = u(),
              a = Math.min(n, e);
            c("searchCleared", {
              page: 1,
              rowCount: a,
              totalCount: e,
              columns: t,
              data: await g({
                page: 1,
                rowsPerPage: a,
                columns: t
              }),
              currentRowCount: d(),
              needsRowUpdate: d() !== a
            }), m(1, e, n)
          } finally {
            s.isBusy = !1
          }
        }
      },
      async sortApplied(e) {
        if (!s.isBusy) {
          var {
            column: e,
            direction: t,
            columns: n
          } = e.detail;
          if (e && t && n?.length) {
            s.isBusy = !0;
            try {
              p(e, t);
              var a = await h(),
                o = (s.currentPage = 1, u()),
                r = Math.min(o, a);
              c("sortDataFetched", {
                column: e,
                direction: t,
                page: 1,
                rowCount: r,
                totalCount: a,
                columns: n,
                data: await g({
                  page: 1,
                  rowsPerPage: r,
                  columns: n
                }),
                currentRowCount: d(),
                needsRowUpdate: d() !== r
              }), m(1, a, o)
            } finally {
              s.isBusy = !1
            }
          }
        }
      },
      async sortCleared() {
        if (!s.isBusy) {
          s.isBusy = !0;
          try {
            var e = await w().catch(() => h()),
              t = (s.currentPage = 1, l()),
              n = u(),
              a = Math.min(n, e);
            c("sortCleared", {
              page: 1,
              rowCount: a,
              totalCount: e,
              columns: t,
              data: await g({
                page: 1,
                rowsPerPage: a,
                columns: t
              }),
              currentRowCount: d(),
              needsRowUpdate: d() !== a
            }), m(1, e, n)
          } finally {
            s.isBusy = !1
          }
        }
      },
      sortIndicatorSort(e) {
        var {
          direction: e,
          columnName: t
        } = e.detail;
        p(t, e), document.dispatchEvent(new CustomEvent("sort:applied", {
          bubbles: !0,
          detail: {
            column: t,
            direction: e,
            columns: l()
          }
        }))
      }
    };
    return {
      getPageData(e, t, n) {
        return g({
          page: e,
          rowsPerPage: t,
          columns: n
        })
      },
      getTotalCount: h,
      getRangeJobData(e, t, n) {
        return i(e, t, n)
      },
      handleRowCountChange(e, t, n, a) {
        return i(a, (e - 1) * t + t, n)
      },
      activateSearch: function(e, t) {
        C(e, t)
      },
      activateSort: function(e, t) {
        p(e, t)
      },
      deactivateSearch: o,
      deactivateSort: w,
      isSearchModeActive: () => "search" === s.mode,
      isSortModeActive: () => "sort" === s.mode,
      getCurrentSearchTerm: () => s.search.term,
      getCurrentSearchType: () => s.search.type,
      getCurrentSortColumn: () => s.sort.column,
      getCurrentSortDirection: () => s.sort.direction,
      getCurrentPage: () => s.currentPage,
      setCurrentPage: e => {
        s.currentPage = e
      },
      initialize() {
        return document.addEventListener("rowManager:rowsAdded", t.rowsAdded), document.addEventListener("pagination:pageChanged", t.pageChanged), document.addEventListener("columnManager:columnAdded", t.columnAdded), document.addEventListener("search:performed", t.searchPerformed), document.addEventListener("search:cleared", t.searchCleared), document.addEventListener("sort:applied", t.sortApplied), document.addEventListener("sort:cleared", t.sortCleared), document.addEventListener("sortIndicator:sort", t.sortIndicatorSort), this
      }
    }
  })(),
  TableTitleModule = (() => {
    let e = null,
      r = {
        titleContainer: null,
        titleHeading: null,
        subtitle: null
      },
      l = {
        mode: "regular",
        search: {
          term: "",
          type: "",
          totalResults: 0
        },
        sort: {
          column: "",
          direction: ""
        },
        normalCount: 0,
        initialized: !1
      };
    class t {
      constructor() {
        this.sortingInProgress = !1, this.initializeElements(), this.setupEventListeners()
      }
      initializeElements() {
        r.titleContainer = TableElementManager.getTableTitle(!0), r.titleContainer && (r.titleHeading = TableElementManager.getTableTitleHeading(!0), r.subtitle = this.getOrCreateSubtitle(), this.setInitialTitle(), this.attemptInitialization())
      }
      getOrCreateSubtitle() {
        var e = r.titleContainer.querySelector(".data-table__subtitle");
        return e || ((e = document.createElement("h6")).classList.add("data-table__subtitle"), r.titleContainer.appendChild(e), e)
      }
      setInitialTitle() {
        r.titleHeading && TableElementManager.updateTitleText(r.titleHeading, "Showing All Data"), r.subtitle && TableElementManager.updateSubtitleText(r.subtitle, "Loading...")
      }
      updateTitleForSearchState() {
        if (r.titleHeading && r.subtitle) {
          let {
            term: e,
            totalResults: t
          } = l.search, n = t + ` result${1!==t?"s":""} found`;
          DOMUtils.batchUpdate(() => {
            r.titleHeading.textContent = `Search for "${e}"`, r.subtitle.textContent = n
          })
        }
      }
      updateTitleForSortState() {
        if (r.titleHeading && r.subtitle) {
          let {
            column: e,
            direction: t
          } = l.sort;
          var a = "up" === t ? "ascending" : "descending",
            o = l.normalCount;
          let n = 0 === o ? a + " • loading..." : o + ` item${1!==o?"s":""} | ${a} `;
          DOMUtils.batchUpdate(() => {
            r.titleHeading.textContent = "Sorted by " + e, r.subtitle.textContent = n
          })
        }
      }
      updateTitleForNormalState() {
        if (r.titleHeading && r.subtitle) {
          var t = l.normalCount;
          let e = t + " item" + (1 !== t ? "s" : "");
          DOMUtils.batchUpdate(() => {
            r.titleHeading.textContent = "Showing All Data", r.subtitle.textContent = e
          })
        }
      }
      attemptInitialization() {
        void 0 !== TableDataModule && TableDataModule.getTotalCount().then(e => {
          0 < e && (l.normalCount = e, this.updateTitleForNormalState(), l.initialized = !0)
        }).catch(() => {})
      }
      setupEventListeners() {
        document.addEventListener("tableData:searchDataFetched", this.handleSearchData.bind(this)), document.addEventListener("tableData:searchCleared", this.handleSearchCleared.bind(this)), document.addEventListener("tableData:sortDataFetched", this.handleSortData.bind(this)), document.addEventListener("sort:cleared", this.handleSortCleared.bind(this)), document.addEventListener("sort:applied", this.handleSortApplied.bind(this)), document.addEventListener("sortIndicator:sort", this.handleSortIndicatorSort.bind(this)), document.addEventListener("tableData:pageDataFetched", this.handlePageData.bind(this))
      }
      handleSearchData(e) {
        var {
          term: e,
          type: t,
          totalResults: n
        } = e.detail;
        l.mode = "search", l.search = {
          term: e,
          type: t,
          totalResults: n
        }, l.initialized = !0, this.updateTitleForSearchState()
      }
      handleSortApplied(e) {
        var {
          column: e,
          direction: t
        } = e.detail;
        this.sortingInProgress = !0, l.mode = "sort", l.sort = {
          column: e,
          direction: t
        }, l.initialized = !0, this.updateTitleForSortState()
      }
      handleSortIndicatorSort(e) {
        var {
          columnName: e,
          direction: t
        } = e.detail;
        this.sortingInProgress = !0, l.mode = "sort", l.sort = {
          column: e,
          direction: t
        }, l.initialized = !0, this.updateTitleForSortState()
      }
      handleSearchCleared(e) {
        e = e.detail.totalCount;
        l.mode = "regular", l.normalCount = e, l.initialized = !0, this.updateTitleForNormalState()
      }
      handleSortData(e) {
        var {
          column: e,
          direction: t,
          totalCount: n
        } = e.detail;
        !n || l.normalCount && 0 !== l.normalCount || (l.normalCount = n), l.mode = "sort", l.sort = {
          column: e,
          direction: t
        }, l.initialized = !0, this.updateTitleForSortState(), this.sortingInProgress = !1
      }
      handleSortCleared() {
        "search" !== l.mode && (l.mode = "regular", 0 < l.normalCount ? this.updateTitleForNormalState() : (DOMUtils.batchUpdate(() => {
          r.titleHeading.textContent = "Showing All Data", r.subtitle.textContent = "Loading..."
        }), this.attemptInitialization()), l.initialized = !0)
      }
      handlePageData(e) {
        "regular" !== l.mode || this.sortingInProgress || (e = e.detail.totalCount, l.normalCount = e, l.initialized = !0, this.updateTitleForNormalState())
      }
      refreshTitle() {
        if (l.initialized) switch (l.mode) {
          case "search":
            this.updateTitleForSearchState();
            break;
          case "sort":
            this.updateTitleForSortState();
            break;
          default:
            this.updateTitleForNormalState()
        } else this.attemptInitialization()
      }
    }
    return {
      initialize() {
        return e = e || new t
      },
      getInstance() {
        return e
      },
      refreshTitle() {
        return e?.refreshTitle()
      },
      getState() {
        return {
          ...l
        }
      }
    }
  })();
//# sourceMappingURL=modules.min.js.map