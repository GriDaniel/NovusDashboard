let ColumnElementManager = (() => {
    let n = null;
    return {
      initialize(e) {
        return n = n || (e => {
          let a = BaseElementManager.createElementManager("column", e),
            l = (Object.entries({
              columnComponent: "column-component",
              columnHeader: "column-header",
              columnTitle: "column-title",
              containerAllColumns: "container-all-columns",
              sortIndicatorPlaceholder: "sort-indicator-placeholder"
            }).forEach(([e, t]) => a.setClassName(e, t)), {
              columnCount: 0,
              columnTitles: [],
              arrowsVisible: !0
            });
          return a.getColumnInsertionPoint = (e = !1) => a.getElement("." + a.getClassName("containerAllColumns"), "getColumnInsertionPoint()", e), a.getColumnComponentClass = () => a.getClassName("columnComponent"), a.getColumnHeaderClass = () => a.getClassName("columnHeader"), a.getColumnTitleClass = () => a.getClassName("columnTitle"), a.getContainerAllColumnsClass = () => a.getClassName("containerAllColumns"), a.getSortIndicatorPlaceholderClass = () => a.getClassName("sortIndicatorPlaceholder"), a.setColumnCount = function(e) {
            l.columnCount = e
          }, a.getColumnCount = () => l.columnCount, a.addColumnTitle = function(e) {
            l.columnTitles.includes(e) || l.columnTitles.push(e)
          }, a.swapColumnTitles = function(e, t) {
            var a = this.getColumnTitleIndex(e),
              n = this.getColumnTitleIndex(t);
            return -1 === a || -1 === n ? (console.warn(`Cannot swap columns: one or both titles not found (${e}, ${t})`), !1) : ([l.columnTitles[a], l.columnTitles[n]] = [t, e], !0)
          }, a.addColumnTitleAtIndex = function(e, t, a) {
            this.removeColumnTitle(e), t = Math.max(0, Math.min(t, l.columnTitles.length)), l.columnTitles.splice(t, 0, a)
          }, a.removeColumnTitle = function(e) {
            e = this.getColumnTitleIndex(e); - 1 !== e && l.columnTitles.splice(e, 1)
          }, a.getColumnTitleIndex = function(e) {
            return l.columnTitles.indexOf(e)
          }, a.getAllColumns = function(e = !1) {
            e = this.getColumnInsertionPoint(e);
            return e ? e.querySelectorAll("." + this.getClassName("columnComponent")) : []
          }, a.getColumnByIndex = function(e, t = !1) {
            t = this.getAllColumns(t);
            return 0 <= e && e < t.length ? t[e] : null
          }, a.getColumnHeaders = function(e = !1) {
            return e ? (e = this.getAllColumns(!0), Array.from(e).map(e => {
              e = e.querySelector("." + this.getClassName("columnTitle"));
              return e ? e.textContent.trim() : ""
            }).filter(Boolean)) : [...l.columnTitles]
          }, a.removeColumnByTitle = function(e) {
            var t;
            for (t of this.getAllColumns()) {
              var a = t.querySelector("." + this.getClassName("columnTitle"));
              if (a && a.textContent.trim() === e) {
                this.removeColumn(t), this.setColumnCount(this.getColumnCount() - 1);
                break
              }
            }
            this.removeColumnTitle(e)
          }, a.toggleDropdownArrows = function(e = !0) {
            var t;
            e !== l.arrowsVisible && ((t = document.getElementById("dropdown-arrow-style")) && t.remove(), e || this.getColumnInsertionPoint() && ((t = document.createElement("style")).id = "dropdown-arrow-style", t.textContent = `.${this.getClassName("containerAllColumns")} .dropdown-arrow { display: none !important; }`, document.head.appendChild(t)), l.arrowsVisible = e)
          }, a.createColumnTemplate = function(e) {
            var t = document.createElement("div"),
              a = (t.classList.add(this.getClassName("columnComponent")), document.createElement("div")),
              n = (a.classList.add("header-cell"), document.createElement("div")),
              l = (n.classList.add("dropdown-container", "column-title-dropdown"), document.createElement("button")),
              o = (l.classList.add("data-table__control-btn-column", this.getClassName("columnTitle")), l.id = e, document.createElement("div")),
              r = (o.classList.add("d-flex", "gap-3", "align-items-center", "justify-content-center", "mx-2"), document.createElement("span")),
              r = (r.classList.add("dropdown-arrow"), o.appendChild(r), l.appendChild(o), document.createElement("div")),
              o = (r.classList.add("dropdown-content-container"), n.appendChild(l), n.appendChild(r), a.appendChild(n), document.createElement("div")),
              l = (o.classList.add("header-cell"), document.createElement("div"));
            l.classList.add(this.getClassName("sortIndicatorPlaceholder")), o.appendChild(l), SortIndicatorModule.registerContainer(l, -1, {
              columnName: e
            });
            return SortIndicatorModule.registerContainerEvents(o, l), t.appendChild(a), t.appendChild(o), this.addColumnTitle(e), DropdownContainerModule.initialize(n), t
          }, a.appendColumns = function(e, a) {
            if (e?.length && a) {
              let t = document.createDocumentFragment();
              e.forEach(e => t.appendChild(e)), DOMUtils.batchUpdate(() => {
                a.appendChild(t)
              })
            }
          }, a.removeColumn = function(e) {
            var t;
            e && ((t = e.querySelector("." + this.getClassName("sortIndicatorPlaceholder"))) && SortIndicatorModule.unregisterContainer(t), DOMUtils.batchUpdate(() => {
              e.remove()
            }))
          }, a
        })(e)
      },
      getInstance() {
        return n
      },
      getColumnInsertionPoint: e => n?.getColumnInsertionPoint(e) ?? null,
      getColumnComponentClass: () => n?.getColumnComponentClass() ?? "column-component",
      getColumnHeaderClass: () => n?.getColumnHeaderClass() ?? "column-header",
      getColumnTitleClass: () => n?.getColumnTitleClass() ?? "column-title",
      getContainerAllColumnsClass: () => n?.getContainerAllColumnsClass() ?? "container-all-columns",
      getSortIndicatorPlaceholderClass: () => n?.getSortIndicatorPlaceholderClass() ?? "sort-indicator-placeholder",
      setColumnCount: e => n?.setColumnCount(e),
      getColumnCount: () => n?.getColumnCount() ?? 0,
      getAllColumns: e => n?.getAllColumns(e) ?? [],
      getColumnByIndex: (e, t) => n?.getColumnByIndex(e, t) ?? null,
      getColumnHeaders: e => n?.getColumnHeaders(e) ?? [],
      addColumnTitle: e => n?.addColumnTitle(e),
      addColumnTitleAtIndex: (e, t, a) => n?.addColumnTitleAtIndex(e, t, a),
      removeColumnTitle: e => n?.removeColumnTitle(e),
      removeColumnByTitle: e => n?.removeColumnByTitle(e),
      getColumnTitleIndex: e => n?.getColumnTitleIndex(e) ?? -1,
      swapColumnTitles: (e, t) => n?.swapColumnTitles(e, t) ?? !1,
      appendColumns: (e, t) => {
        n && n.appendColumns(e, t)
      },
      removeColumn: e => {
        n && n.removeColumn(e)
      },
      createColumnTemplate: e => n?.createColumnTemplate(e) ?? null,
      setClassName: (e, t) => n?.setClassName(e, t),
      getClassName: e => n?.getClassName(e) ?? null,
      clearCache: () => n?.clearCache(),
      toggleDropdownArrows: e => n?.toggleDropdownArrows(e),
      hideDropdownArrows: () => n?.toggleDropdownArrows(!1),
      showDropdownArrows: () => n?.toggleDropdownArrows(!0)
    }
  })(),
  DropdownElementManager = (() => {
    let a = null;
    return {
      initialize(e) {
        return a = a || (e => {
          let r = BaseElementManager.createElementManager("dropdown", e),
            t = (Object.entries({
              dropdownButton: "data-table__control-btn",
              dropdownButtonColumn: "data-table__control-btn-column",
              dropdownContent: "dropdown-content-container",
              arrow: "dropdown-arrow",
              showClass: "show",
              openClass: "open",
              staticInput: "static-input",
              dropdownItem: "dropdown-item",
              dropdownContainer: "dropdown-container",
              customInput: "custom-input",
              setButton: "set-button",
              valueContainer: "d-flex",
              valueText: "span:first-child",
              sortIndicators: "sort-indicators",
              checkboxList: "checkbox-list",
              checkboxItem: "checkbox-item",
              closeIcon: "close-static-input",
              closeButton: "close-button",
              titleElement: "title-element"
            }).forEach(([e, t]) => r.setClassName(e, t)), r.dropdownTypes = {
              "column-dropdown": "column",
              "row-dropdown": "row",
              "search-dropdown": "search",
              "sort-dropdown": "sort",
              "column-title-dropdown": "column-title",
              "row-info-dropdown": "row-info"
            }, r.getDropdownType = e => {
              if (e)
                for (var [t, a] of Object.entries(r.dropdownTypes))
                  if (e.classList.contains(t)) return a;
              return null
            }, (e, t, a) => e ? r.getElement("." + r.getClassName(t), a, !1, e) : null);
          return r.getDropdownButton = e => t(e, "dropdownButton", "getDropdownButton()"), r.getDropdownButtonColumn = e => t(e, "dropdownButtonColumn", "getDropdownButtonColumn()"), r.getDropdownContent = e => t(e, "dropdownContent", "getDropdownContent()"), r.getCloseIcon = e => t(e, "closeIcon", "getCloseIcon()"), r.getArrow = e => t(e, "arrow", "getArrow()"), r.getCloseButton = e => t(e, "closeButton", "getCloseButton()"), r.getTitleElement = e => t(e, "titleElement", "getTitleElement()"), r.getValueContainer = e => e ? (e = r.getDropdownButton(e), t(e, "valueContainer", "getValueContainer()")) : null, r.getValueText = e => (e = e && r.getValueContainer(e)) ? r.getElement(r.getClassName("valueText"), "getValueText()", !1, e) : null, r.getStaticInputButtons = e => e ? Array.from(e.querySelectorAll("." + r.getClassName("staticInput"))) : [], r.getSetButton = e => t(e, "setButton", "getSetButton()"), r.getCustomInput = e => t(e, "customInput", "getCustomInput()"), r.getCheckboxList = e => t(e, "checkboxList", "getCheckboxList()"), r.getCheckboxItem = e => t(e, "checkboxItem", "getCheckboxItem()"), r.getFirstDropdownItem = e => (e = e && r.getDropdownContent(e)) ? r.getElement(`.${r.getClassName("dropdownItem")}:first-child`, "getFirstDropdownItem()", !1, e) : null, r.getAllDropdownContainers = () => r.getElements("." + r.getClassName("dropdownContainer"), "getAllDropdownContainers()"), r.getSortIndicators = e => e ? Array.from(e.querySelectorAll("." + r.getClassName("sortIndicators"))) : [], r.createCloseButton = e => {
            var t = document.createElement("button"),
              e = (t.className = `${r.getClassName("dropdownItem")} ${r.getClassName("staticInput")} ` + r.getClassName("closeButton"), e || "Close");
            return t.innerHTML = `
        ${e}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `, t
          }, r.createValueStructure = (e, t) => {
            if (!e || !t) return {
              textElem: null,
              arrow: null
            };
            let a = document.createElement("span"),
              n = document.createElement("span");
            n.className = r.getClassName("arrow");
            var l = Array.from(e.childNodes).find(e => e.nodeType === Node.TEXT_NODE && e.textContent.trim());
            let o = l ? l.textContent.trim() : "";
            return DOMUtils.batchUpdate(() => {
              a.textContent = t, e.innerHTML = "", o && e.appendChild(document.createTextNode(o)), e.appendChild(a), e.appendChild(n), e.setAttribute("title", t)
            }), {
              textElem: a,
              arrow: n
            }
          }, r
        })(e)
      },
      getInstance: () => a,
      getDropdownType: e => a?.getDropdownType(e) ?? null,
      getDropdownButton: e => a?.getDropdownButton(e) ?? null,
      getDropdownButtonColumn: e => a?.getDropdownButtonColumn(e) ?? null,
      getDropdownContent: e => a?.getDropdownContent(e) ?? null,
      getArrow: e => a?.getArrow(e) ?? null,
      getValueContainer: e => a?.getValueContainer(e) ?? null,
      getValueText: e => a?.getValueText(e) ?? null,
      getStaticInputButtons: e => a?.getStaticInputButtons(e) ?? [],
      getSetButton: e => a?.getSetButton(e) ?? null,
      getCustomInput: e => a?.getCustomInput(e) ?? null,
      getCheckboxList: e => a?.getCheckboxList(e) ?? null,
      getCheckboxItem: e => a?.getCheckboxItem(e) ?? null,
      getCloseIcon: e => a?.getCloseIcon(e) ?? null,
      getFirstDropdownItem: e => a?.getFirstDropdownItem(e) ?? null,
      getAllDropdownContainers: () => a?.getAllDropdownContainers() ?? [],
      getSortIndicators: e => a?.getSortIndicators(e) ?? [],
      getCloseButton: e => a?.getCloseButton(e) ?? null,
      getTitleElement: e => a?.getTitleElement(e) ?? null,
      createCloseButton: e => a?.createCloseButton(e) ?? null,
      createValueStructure: (e, t) => a?.createValueStructure(e, t) ?? {
        textElem: null,
        arrow: null
      },
      getInstancesByType: t => a && t ? Array.from(a.getAllDropdownContainers()).filter(e => a.getDropdownType(e) === t) : [],
      getClassName: e => a?.getClassName(e) ?? "",
      clearCache: () => a?.clearCache()
    }
  })(),
  PaginationElementManager = (() => {
    let a = null;
    return {
      initialize(e) {
        return a = a || (e => {
          let l = BaseElementManager.createElementManager("pagination", e),
            a = (Object.entries({
              paginationContainer: "data-table__pagination",
              paginationControls: "pagination-controls",
              paginationInfo: "pagination-info",
              currentPage: "current",
              maxPage: "next",
              fastForwardButton: "double-triangle-east",
              fastBackwardButton: "double-triangle-west"
            }).forEach(([e, t]) => l.setClassName(e, t)), (e, t, a = !1, n = null) => {
              e = "." + l.getClassName(e);
              return n ? n.querySelector(e) : l.getElement(e, t, a)
            });
          return l.getPaginationControls = (e = !1) => a("paginationControls", "@getPaginationControls()", e), l.getPaginationInfo = (e = !1) => a("paginationInfo", "@getPaginationInfo()", e), l.getCurrentPage = (e = !1) => {
            var t = l.getPaginationInfo(e);
            return t ? a("currentPage", "@getCurrentPage()", e, t) : null
          }, l.getMaxPage = (e = !1) => {
            var t = l.getPaginationInfo(e);
            return t ? a("maxPage", "@getMaxPage()", e, t) : null
          }, l.getPrevious = (e = !1) => {
            e = l.getPaginationControls(e);
            return e ? (e.querySelector(".d-flex.flex-row.h-100:first-of-type")?.querySelectorAll(".pagination-button"))?.[1] ?? null : null
          }, l.getFastBackward = (e = !1) => {
            var t, e = l.getPaginationControls(e);
            return e ? (t = l.getClassName("fastBackwardButton"), e.querySelector("." + t)?.closest(".pagination-button") ?? null) : null
          }, l.getNext = (e = !1) => {
            e = l.getPaginationControls(e);
            return e ? (e.querySelector(".d-flex.flex-row.h-100:last-of-type")?.querySelectorAll(".pagination-button"))?.[0] ?? null : null
          }, l.getFastForward = (e = !1) => {
            var t, e = l.getPaginationControls(e);
            return e ? (t = l.getClassName("fastForwardButton"), e.querySelector("." + t)?.closest(".pagination-button") ?? null) : null
          }, l.setCurrentPageText = function(e) {
            let t = this.getCurrentPage();
            t && DOMUtils.batchUpdate(() => {
              t.textContent = e
            })
          }, l.setMaxPageText = function(t) {
            let a = this.getMaxPage();
            if (a) {
              let e = t + " page" + (1 !== t ? "s" : "");
              DOMUtils.batchUpdate(() => {
                a.textContent = e
              })
            }
          }, l.updateButtonStates = function(e, t) {
            let a = {
              prev: this.getPrevious(),
              fastBack: this.getFastBackward(),
              next: this.getNext(),
              fastForward: this.getFastForward()
            };
            (a.prev || a.fastBack || a.next || a.fastForward) && DOMUtils.batchUpdate(() => {
              a.prev && a.prev.classList.toggle("disabled", e <= 1), a.fastBack && a.fastBack.classList.toggle("disabled", e <= 1), a.next && a.next.classList.toggle("disabled", t <= e), a.fastForward && a.fastForward.classList.toggle("disabled", t <= e)
            })
          }, l
        })(e)
      },
      getInstance() {
        return a
      },
      getPaginationControls: e => a?.getPaginationControls(e) ?? null,
      getPaginationInfo: e => a?.getPaginationInfo(e) ?? null,
      getCurrentPage: e => a?.getCurrentPage(e) ?? null,
      getMaxPage: e => a?.getMaxPage(e) ?? null,
      getPrevious: e => a?.getPrevious(e) ?? null,
      getFastBackward: e => a?.getFastBackward(e) ?? null,
      getNext: e => a?.getNext(e) ?? null,
      getFastForward: e => a?.getFastForward(e) ?? null,
      setCurrentPageText: e => {
        a && a.setCurrentPageText(e)
      },
      setMaxPageText: e => {
        a && a.setMaxPageText(e)
      },
      updateButtonStates: (e, t) => {
        a && a.updateButtonStates(e, t)
      },
      getClassName: e => a?.getClassName(e) ?? "",
      clearCache: () => a?.clearCache()
    }
  })(),
  RowElementManager = (() => {
    let a = null,
      c = ["Name", "File Path", "Profile Name", "Length", "Front-cut Off Distance", "Square-up Distance"];
    return {
      initialize(e) {
        return a = a || (e => {
          let a = BaseElementManager.createElementManager("row", e);
          return Object.entries({
            tableRow: "table-row",
            columnCell: "column-cell",
            containerAllRows: "container-all-rows"
          }).forEach(([e, t]) => a.setClassName(e, t)), a.getRowInsertionPoint = (e = !1) => a.getElement("." + a.getClassName("containerAllRows"), "getRowInsertionPoint()", e), a.getAllRows = function(e = !1) {
            e = this.getRowInsertionPoint(e);
            return e ? e.querySelectorAll("." + this.getClassName("tableRow")) : []
          }, a.getRowByIndex = function(e, t = !1) {
            t = this.getAllRows(t);
            return 0 <= e && e < t.length ? t[e] : null
          }, a.getRowCount = e => a.getAllRows(e).length, a.getCellsForRow = e => e ? e.querySelectorAll("." + a.getClassName("columnCell")) : [], a.getTableRowClass = () => a.getClassName("tableRow"), a.getColumnCellClass = () => a.getClassName("columnCell"), a.getContainerAllRowsClass = () => a.getClassName("containerAllRows"), a.createCellTemplate = function(e = 0) {
            var t = document.createElement("div");
            return t.classList.add(this.getClassName("columnCell")), t
          }, a.createDropdownArrow = function() {
            var e = document.createElement("div");
            return e.classList.add("table-row-dropdown-arrow"), e
          }, a.createAttributePair = function(e) {
            var t = document.createElement("div"),
              a = (t.className = "attribute-pair", document.createElement("span")),
              n = (a.className = "attribute-name", a.textContent = e.name + ": ", document.createElement("span"));
            return n.className = "attribute-value", n.textContent = e.value, t.appendChild(a), t.appendChild(n), t
          }, a.addRowStyles = function() {
            if (!document.getElementById("row-manager-styles")) {
              let e = document.createElement("style");
              e.id = "row-manager-styles", e.textContent = `
.${this.getClassName("tableRow")} {
    display: flex;
    flex-wrap: wrap;
}
.${this.getClassName("columnCell")} {
    flex-grow: 1;
}
.table-row-dropdown-arrow {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-right: 2px solid #666;
    border-bottom: 2px solid #666;
    transform: rotate(45deg);
    transition: transform 0.3s ease;
    z-index: 500;
}
.table-row-dropdown-arrow.table-row-dropdown-open {
    transform: rotate(-135deg);
}
.detail-panel {
    flex-basis: 100%;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.3s ease-in-out;
    box-sizing: border-box;
    border-top: 1px solid #ddd;
    order: 999; /* Ensures it always appears after all cells */
}

/* Apply the same color convention to the detail panels as their parent rows */
 .detail-panel {
    background-color:  #F1F2F4;
   
}

.detail-panel.expanded {
    max-height: 180px;
    height: 180px;
}
.detail-content {
    padding: 12px 16px;
   
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.detail-header {
    width: 100%;
    margin-bottom: 10px;
    padding-bottom: 6px;
}

.detail-title {
    font-size: 12px;
    font-weight: 400;
    color: #86868b;
    letter-spacing: 0.01em;
    padding-top: 12.5px;
}

.attributes-layout {
    display: flex;
    flex-direction: column;
    gap: 0px 32px;
    width: 100%;
    padding: 4px 0;
}

.attribute-group {
    display: flex;
    flex-direction: column;
    height: auto;
    width: 350px;
}

.attribute-pair {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    height: auto;
    width: auto;
}

.attribute-name {
    font-size: 12px;
    font-weight: 500;
    color: #6B778C;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
    width: 50%;
}

.attribute-value {
    font-size: 13px;
    font-weight: 400;
    color: #1d1d1f;
    word-break: break-word;
    overflow-wrap: break-word;
    width: 50%;
    padding-left: 8px;
    border-left: 1px solid #E9EBEE;
}

/* Row interactivity disabled state */
.rows-not-interactive {
    pointer-events: none;
}
.rows-not-interactive .table-row-dropdown-arrow {
    display: none !important;
}`, DOMUtils.batchUpdate(() => {
                document.head.appendChild(e)
              })
            }
          }, a.createBaseRow = function(t) {
            var a = document.createElement("div"),
              e = (a.classList.add(this.getClassName("tableRow")), a.style.position = "relative", a.dataset.expanded = "false", this.createDropdownArrow());
            a.appendChild(e);
            for (let e = 0; e < t; e++) a.appendChild(this.createCellTemplate());
            return a
          }, a.createErrorDetailPanel = function(e) {
            var t = document.createElement("div"),
              a = (t.className = "detail-panel", document.createElement("div"));
            return a.className = "detail-content", a.textContent = e || "Unable to load additional information.", a.style.color = "red", t.appendChild(a), t
          }, a.createDetailPanel = function(t, a) {
            var e = document.createElement("div"),
              n = (e.className = "detail-panel", document.createElement("div")),
              l = (n.className = "detail-content", document.createElement("div")),
              o = (l.className = "detail-header", document.createElement("div")),
              r = (o.className = "detail-title", o.textContent = "Additional Information", l.appendChild(o), n.appendChild(l), document.createElement("div")),
              s = (r.className = "attributes-layout", c.filter(e => !a.includes(e)));
            if (0 === s.length) {
              o = document.createElement("div");
              o.textContent = "All available information is already displayed in the table.", o.style.fontStyle = "italic", o.style.color = "#666", r.appendChild(o)
            } else
              for (let e = 0; e < s.length; e += 2) {
                var i = document.createElement("div"),
                  d = (i.className = "attribute-group", s[e]);
                i.appendChild(this.createAttributePair({
                  name: d,
                  value: t[d] || "N/A"
                })), e + 1 < s.length && (d = s[e + 1], i.appendChild(this.createAttributePair({
                  name: d,
                  value: t[d] || "N/A"
                }))), r.appendChild(i)
              }
            return n.appendChild(r), e.appendChild(n), e
          }, a.createRowTemplate = function(e) {
            this.addRowStyles();
            e = this.createBaseRow(e);
            return this._addCellMethod(e), this._setInitialRowInteractivity(e), this._delegationInitialized || this._setupRowDelegation(), e
          }, a._addCellMethod = function(e) {
            let a = this;
            e.addCell = function(e) {
              var t = this.querySelector(".detail-panel"),
                e = a.createCellTemplate(e);
              t ? this.insertBefore(e, t) : this.appendChild(e)
            }
          }, a._setInitialRowInteractivity = function(e) {
            let t = !this._areAllColumnsDisplayed(),
              a = e.querySelector(".table-row-dropdown-arrow");
            DOMUtils.batchUpdate(() => {
              e.style.cursor = t ? "pointer" : "default", a && (a.style.display = t ? "block" : "none")
            })
          }, a._areAllColumnsDisplayed = function() {
            let t = ColumnElementManager.getColumnHeaders();
            return c.every(e => t.includes(e))
          }, a._setupRowDelegation = function() {
            var e = this.getRowInsertionPoint();
            if (e) {
              let t = this;
              e.classList.remove("rows-not-interactive"), e.addEventListener("click", function(e) {
                t._areAllColumnsDisplayed() || (e = e.target.closest("." + t.getClassName("tableRow"))) && t._handleRowClick(e)
              }), this._setupColumnChangeListeners(), this._delegationInitialized = !0
            }
          }, a._handleRowClick = function(t) {
            var e = Array.from(this.getAllRows()).indexOf(t);
            let a = !("true" === t.dataset.expanded);
            DOMUtils.batchUpdate(() => {
              t.dataset.expanded = a ? "true" : "false";
              var e = t.querySelector(".table-row-dropdown-arrow");
              e && e.classList.toggle("table-row-dropdown-open", a)
            }), a ? this._expandRowDetailPanel(t, e) : this._collapseRowDetailPanel(t)
          }, a._expandRowDetailPanel = function(a, n) {
            let l = a.querySelector(".detail-panel");
            l && a.removeChild(l);
            var e = PaginationElementManager.getCurrentPage(),
              e = e && parseInt(e.textContent) || 1;
            TableDataModule.getPageData(e, RowManagerModule.getRowCount(), c).then(e => {
              var t;
              e && Array.isArray(e) && e[n] ? (e = e[n], t = ColumnElementManager.getColumnHeaders(), l = this.createDetailPanel(e, t), this._animateDetailPanelOpen(a, l)) : console.error("No data available for row", n)
            }).catch(e => {
              console.error("Error fetching row data:", e), l = this.createErrorDetailPanel(), this._animateDetailPanelOpen(a, l)
            })
          }, a._collapseRowDetailPanel = function(e) {
            let t = e.querySelector(".detail-panel");
            t && (DOMUtils.batchUpdate(() => {
              t.classList.remove("expanded")
            }), setTimeout(() => {
              t.parentNode === e && DOMUtils.batchUpdate(() => {
                e.removeChild(t)
              })
            }, 300))
          }, a._animateDetailPanelOpen = function(e, t) {
            DOMUtils.batchUpdate(() => {
              e.appendChild(t), t.offsetHeight, t.classList.add("expanded")
            })
          }, a._setupColumnChangeListeners = function() {
            document.addEventListener("columnHeaders:refreshed", () => {
              this._updateRowInteractivity(), this._refreshOpenDetailPanels()
            }), document.addEventListener("columnManager:columnAdded", () => {
              this._updateRowInteractivity(), this._refreshOpenDetailPanels()
            }), document.addEventListener("columnManager:columnDeleted", () => {
              this._updateRowInteractivity(), this._refreshOpenDetailPanels()
            }), document.addEventListener("columnTitle:changed", () => {
              this._updateRowInteractivity(), this._refreshOpenDetailPanels()
            }), setTimeout(() => this._updateRowInteractivity(), 0)
          }, a._updateRowInteractivity = function() {
            let e = this.getRowInsertionPoint();
            if (e) {
              var t = this.getAllRows();
              let a = !this._areAllColumnsDisplayed();
              DOMUtils.batchUpdate(() => {
                e.classList.toggle("rows-not-interactive", !a)
              }), a || t.forEach(e => {
                "true" === e.dataset.expanded && this.collapseExpandedRow(e)
              }), t.forEach(t => {
                DOMUtils.batchUpdate(() => {
                  t.style.cursor = a ? "pointer" : "default";
                  var e = t.querySelector(".table-row-dropdown-arrow");
                  e && (e.style.display = a ? "block" : "none")
                })
              })
            }
          }, a._refreshOpenDetailPanels = function() {
            var e = this.getAllRows();
            let n = ColumnElementManager.getColumnHeaders();
            var t = PaginationElementManager.getCurrentPage();
            let l = t && parseInt(t.textContent) || 1;
            e.forEach((e, a) => {
              if ("true" === e.dataset.expanded) {
                let t = e.querySelector(".detail-panel");
                t && TableDataModule.getPageData(l, RowManagerModule.getRowCount(), c).then(e => {
                  e && Array.isArray(e) && e[a] ? (e = e[a], this._updateDetailPanelContent(t, e, n)) : console.error("No data available for row", a)
                }).catch(e => {
                  console.error("Error refreshing detail panel data:", e)
                })
              }
            })
          }, a._updateDetailPanelContent = function(e, l, o) {
            let r = e.querySelector(".attributes-layout");
            if (!r) {
              e = e.querySelector(".detail-content");
              if (!e) return;
              (r = document.createElement("div")).className = "attributes-layout", e.appendChild(r)
            }
            DOMUtils.batchUpdate(() => {
              r.innerHTML = "";
              var t = c.filter(e => !o.includes(e));
              if (0 === t.length) {
                var e = document.createElement("div");
                e.textContent = "All available information is already displayed in the table.", e.style.fontStyle = "italic", e.style.color = "#666", r.appendChild(e)
              } else
                for (let e = 0; e < t.length; e += 2) {
                  var a = document.createElement("div"),
                    n = (a.className = "attribute-group", t[e]);
                  a.appendChild(this.createAttributePair({
                    name: n,
                    value: l[n] || "N/A"
                  })), e + 1 < t.length && (n = t[e + 1], a.appendChild(this.createAttributePair({
                    name: n,
                    value: l[n] || "N/A"
                  }))), r.appendChild(a)
                }
            })
          }, a.appendRows = function(e, a) {
            if (e && e.length && a) {
              let t = document.createDocumentFragment();
              e.forEach(e => t.appendChild(e)), DOMUtils.batchUpdate(() => {
                a.appendChild(t)
              })
            }
          }, a.removeLastNRows = function(t, a) {
            if (!a || t <= 0) return [];
            let n = [];
            return DOMUtils.batchUpdate(() => {
              for (let e = 0; e < t; e++) a.lastChild && (n.push(a.lastChild), a.removeChild(a.lastChild))
            }), n
          }, a.clearRowsContent = function(e) {
            e && e.length && DOMUtils.batchUpdate(() => {
              e.forEach(e => {
                this.getCellsForRow(e).forEach(e => {
                  e.textContent = ""
                })
              })
            })
          }, a.collapseExpandedRow = function(t) {
            t && "true" === t.dataset.expanded && (DOMUtils.batchUpdate(() => {
              t.dataset.expanded = "false";
              var e = t.querySelector(".table-row-dropdown-arrow"),
                e = (e && e.classList.remove("table-row-dropdown-open"), t.querySelector(".detail-panel"));
              e && e.classList.remove("expanded")
            }), t.querySelector(".detail-panel")) && setTimeout(() => {
              let e = t.querySelector(".detail-panel");
              e && e.parentNode === t && DOMUtils.batchUpdate(() => {
                t.removeChild(e)
              })
            }, 300)
          }, a.createCellsForColumns = function(n) {
            let e = this.getAllRows(!0),
              l = [];
            return DOMUtils.batchUpdate(() => {
              e.forEach(t => {
                for (let e = 0; e < n; e++) {
                  var a = this.createCellTemplate("");
                  t.appendChild(a), l.push(a)
                }
              })
            }), l
          }, a.removeCellsAtColumnIndex = function(t) {
            let e = this.getAllRows(!0);
            DOMUtils.batchUpdate(() => {
              e.forEach(e => {
                e = this.getCellsForRow(e);
                e?.length > t && e[t].remove()
              })
            })
          }, a.SUPPORTED_COLUMNS = c, a
        })(e)
      },
      getInstance() {
        return a
      },
      getRowInsertionPoint: e => a?.getRowInsertionPoint(e) ?? null,
      getAllRows: e => a?.getAllRows(e) ?? [],
      getRowByIndex: (e, t) => a?.getRowByIndex(e, t) ?? null,
      getRowCount: e => a?.getRowCount(e) ?? 0,
      getCellsForRow: e => a?.getCellsForRow(e) ?? [],
      getTableRowClass: () => a?.getTableRowClass() ?? "table-row",
      getColumnCellClass: () => a?.getColumnCellClass() ?? "column-cell",
      getContainerAllRowsClass: () => a?.getContainerAllRowsClass() ?? "container-all-rows",
      createRowTemplate: (e, t) => a?.createRowTemplate(e, t) ?? null,
      createCellTemplate: e => a?.createCellTemplate(e) ?? null,
      createAttributePair: e => a?.createAttributePair(e) ?? null,
      appendRows: (e, t) => {
        a && a.appendRows(e, t)
      },
      removeLastNRows: (e, t) => a ? a.removeLastNRows(e, t) : [],
      clearRowsContent: e => {
        a && a.clearRowsContent(e)
      },
      collapseExpandedRow: e => {
        a && a.collapseExpandedRow(e)
      },
      createCellsForColumns: e => a?.createCellsForColumns(e) ?? [],
      removeCellsAtColumnIndex: e => a?.removeCellsAtColumnIndex(e),
      setClassName: (e, t) => a?.setClassName(e, t),
      getClassName: e => a?.getClassName(e) ?? null,
      clearCache: () => a?.clearCache(),
      SUPPORTED_COLUMNS: c
    }
  })(),
  SearchElementManager = (() => {
    let n = null;
    return {
      initialize(e) {
        return n = n || (e => {
          let a = BaseElementManager.createElementManager("search", e);
          return Object.entries({
            searchInput: "search-input",
            clearButton: "clear-button",
            searchContainer: "search-text",
            searchIcon: "search-icon",
            searchArea: "data-table__search",
            searchResults: "search-results-container",
            hidden: "d-none"
          }).forEach(([e, t]) => a.setClassName(e, t)), a.getSearchInput = e => a.getElement("." + a.getClassName("searchInput"), "getSearchInput()", e), a.getClearIcon = e => a.getElement("." + a.getClassName("clearButton"), "getClearIcon()", e), a.getSearchContainer = e => a.getElement("." + a.getClassName("searchContainer"), "getSearchContainer()", e), a.getSearchIcon = e => a.getElement("." + a.getClassName("searchIcon"), "getSearchIcon()", e), a.getSearchArea = e => a.getElement("." + a.getClassName("searchArea"), "getSearchArea()", e), a.getSearchResultsContainer = e => a.getElement("." + a.getClassName("searchResults"), "getSearchResultsContainer()", e), a.getHiddenClass = () => a.getClassName("hidden"), a.updatePlaceholder = function(e, t) {
            e && DOMUtils.batchUpdate(() => {
              e.placeholder = t
            })
          }, a.updateClearButtonVisibility = function(e, t) {
            e && DOMUtils.batchUpdate(() => {
              t ? e.classList.remove(this.getClassName("hidden")) : e.classList.add(this.getClassName("hidden"))
            })
          }, a.clearSearchInput = function(e, t, a) {
            e && DOMUtils.batchUpdate(() => {
              e.value = "", t && t.classList.add(this.getClassName("hidden")), a && (a.textContent = "")
            })
          }, a.setSearchResultText = function(e, t) {
            e && DOMUtils.batchUpdate(() => {
              e.textContent = t
            })
          }, a
        })(e)
      },
      getInstance: () => n,
      getSearchInput: e => n?.getSearchInput(e) ?? null,
      getClearIcon: e => n?.getClearIcon(e) ?? null,
      getSearchContainer: e => n?.getSearchContainer(e) ?? null,
      getSearchIcon: e => n?.getSearchIcon(e) ?? null,
      getSearchArea: e => n?.getSearchArea(e) ?? null,
      getSearchResultsContainer: e => n?.getSearchResultsContainer(e) ?? null,
      getHiddenClass: () => n?.getHiddenClass() ?? "d-none",
      updatePlaceholder: (e, t) => {
        n && n.updatePlaceholder(e, t)
      },
      updateClearButtonVisibility: (e, t) => {
        n && n.updateClearButtonVisibility(e, t)
      },
      clearSearchInput: (e, t, a) => {
        n && n.clearSearchInput(e, t, a)
      },
      setSearchResultText: (e, t) => {
        n && n.setSearchResultText(e, t)
      },
      clearCache: () => n?.clearCache()
    }
  })(),
  SortIndicatorElementManager = (() => {
    let n = null;
    return {
      initialize(e) {
        return n = n || (e => {
          let a = BaseElementManager.createElementManager("sortIndicator", e);
          return Object.entries({
            sortIndicatorsClass: "sort-indicators",
            triangleUpClass: "triangle-up",
            triangleDownClass: "triangle-down",
            disabledClass: "disabled"
          }).forEach(([e, t]) => a.setClassName(e, t)), a.getSortIndicatorsClass = () => a.getClassName("sortIndicatorsClass"), a.getTriangleUpClass = () => a.getClassName("triangleUpClass"), a.getTriangleDownClass = () => a.getClassName("triangleDownClass"), a.getDisabledClass = () => a.getClassName("disabledClass"), a.createSortIndicatorTemplate = function() {
            let e = document.createElement("div");
            e.className = this.getClassName("sortIndicatorsClass");
            var t = document.createElement("span"),
              a = (t.className = this.getClassName("triangleUpClass") + " " + this.getClassName("disabledClass"), t.style.cursor = "pointer", t.style.scale = 1.5, document.createElement("span"));
            return a.className = this.getClassName("triangleDownClass") + " " + this.getClassName("disabledClass"), a.style.cursor = "pointer", a.style.scale = 1.5, e.appendChild(t), e.appendChild(a), DOMUtils.batchUpdate(() => {
              e.style.gap = "10px", e.style.marginBottom = "6px", e.style.display = "flex"
            }), e
          }, a.createSortPlaceholder = function() {
            var e = document.createElement("div");
            return e.className = "sort-indicator-placeholder", e
          }, a.setTriangleState = function(a, n, l) {
            if (a) {
              let e = a.querySelector("." + this.getClassName("triangleUpClass")),
                t = a.querySelector("." + this.getClassName("triangleDownClass"));
              e && t && DOMUtils.batchUpdate(() => {
                e.classList.add(this.getClassName("disabledClass")), t.classList.add(this.getClassName("disabledClass")), l && "up" === n ? e.classList.remove(this.getClassName("disabledClass")) : l && "down" === n && t.classList.remove(this.getClassName("disabledClass"))
              })
            }
          }, a.clearIndicator = function(a) {
            if (a) {
              let e = a.querySelector("." + this.getClassName("triangleUpClass")),
                t = a.querySelector("." + this.getClassName("triangleDownClass"));
              DOMUtils.batchUpdate(() => {
                e && e.classList.add(this.getClassName("disabledClass")), t && t.classList.add(this.getClassName("disabledClass"))
              })
            }
          }, a.removeIndicator = function(e) {
            e && e.parentNode && DOMUtils.batchUpdate(() => {
              e.parentNode.removeChild(e)
            })
          }, a
        })(e)
      },
      getInstance: () => n,
      getSortIndicatorsClass: () => n?.getSortIndicatorsClass() ?? "sort-indicators",
      getTriangleUpClass: () => n?.getTriangleUpClass() ?? "triangle-up",
      getTriangleDownClass: () => n?.getTriangleDownClass() ?? "triangle-down",
      getDisabledClass: () => n?.getDisabledClass() ?? "disabled",
      createSortIndicatorTemplate: () => n?.createSortIndicatorTemplate() ?? null,
      createSortPlaceholder: () => n?.createSortPlaceholder() ?? null,
      setTriangleState: (e, t, a) => {
        n && n.setTriangleState(e, t, a)
      },
      clearIndicator: e => {
        n && n.clearIndicator(e)
      },
      removeIndicator: e => {
        n && n.removeIndicator(e)
      },
      setClassName: (e, t) => n?.setClassName(e, t),
      getClassName: e => n?.getClassName(e) ?? null,
      clearCache: () => n?.clearCache()
    }
  })(),
  TableElementManager = (() => {
    let a = null;
    return {
      initialize(e) {
        return a = a || (e => {
          let a = BaseElementManager.createElementManager("tableUI", e);
          return Object.entries({
            tableTitle: "data-table__title",
            tableControls: "data-table__controls",
            moveColumnsHeader: "move-columns-header",
            moveColumnsExit: "move-columns-exit"
          }).forEach(([e, t]) => a.setClassName(e, t)), a.getTableTitle = e => a.getElement("." + a.getClassName("tableTitle"), "getTableTitle()", e), a.getTableControls = e => a.getElement("." + a.getClassName("tableControls"), "getTableControls()", e), a.getTableTitleHeading = e => {
            e = a.getTableTitle(e);
            return e ? e.querySelector("h4") : null
          }, a.createMoveColumnsHeader = (e = "Select Column(s) to Move") => {
            var t = document.createElement("div");
            return t.classList.add(a.getClassName("moveColumnsHeader")), t.textContent = e, t
          }, a.createMoveColumnsExit = (e = "← Return") => {
            var t = document.createElement("div");
            return t.classList.add(a.getClassName("moveColumnsExit")), t.textContent = e, t.style.cursor = "pointer", t
          }, a.getOrCreateSubtitle = function(e) {
            if (!e) return null;
            var t = e.querySelector(".data-table__subtitle");
            if (t) return t;
            let a = document.createElement("p");
            return a.classList.add("data-table__subtitle"), DOMUtils.batchUpdate(() => {
              e.appendChild(a)
            }), a
          }, a.updateTitleText = function(e, t) {
            e && DOMUtils.batchUpdate(() => {
              e.textContent = t
            })
          }, a.updateSubtitleText = function(e, t) {
            e && DOMUtils.batchUpdate(() => {
              e.textContent = t
            })
          }, a.applyMoveColumnsHeaderStyle = function(e) {
            return e && DOMUtils.batchUpdate(() => {
              e.style.fontSize = "20px", e.style.fontWeight = "400", e.style.paddingTop = "15px"
            }), e
          }, a.applyMoveColumnsExitStyle = function(e) {
            return e && DOMUtils.batchUpdate(() => {
              e.style.fontSize = "18px", e.style.fontWeight = "400", e.style.paddingTop = "15px"
            }), e
          }, a
        })(e)
      },
      getInstance: () => a,
      getTableTitle: e => a?.getTableTitle(e) ?? null,
      getTableControls: e => a?.getTableControls(e) ?? null,
      getTableTitleHeading: e => a?.getTableTitleHeading(e) ?? null,
      createMoveColumnsHeader: e => a?.createMoveColumnsHeader(e) ?? null,
      createMoveColumnsExit: e => a?.createMoveColumnsExit(e) ?? null,
      getOrCreateSubtitle: e => a?.getOrCreateSubtitle(e) ?? null,
      updateTitleText: (e, t) => {
        a && a.updateTitleText(e, t)
      },
      updateSubtitleText: (e, t) => {
        a && a.updateSubtitleText(e, t)
      },
      applyMoveColumnsHeaderStyle: e => a?.applyMoveColumnsHeaderStyle(e) ?? e,
      applyMoveColumnsExitStyle: e => a?.applyMoveColumnsExitStyle(e) ?? e,
      setClassName: (e, t) => a?.setClassName(e, t),
      getClassName: e => a?.getClassName(e) ?? null,
      clearCache: () => a?.clearCache()
    }
  })(),
  BaseElementManager = {
    createElementManager(l, e) {
      return {
        moduleContainer: e instanceof NodeList ? e[0] : e,
        elementCache: ElementCache.createCache(l),
        classNameRegistry: {},
        getElement(e, t = l, a = !1, n) {
          n = n || this.moduleContainer, n = this.elementCache.get(e, n, a);
          return n || console.warn(t + " --\x3e Element not found: " + e), n
        },
        getElements(e, t = l, a = !1, n) {
          n = n || this.moduleContainer, n = this.elementCache.getAll(e, n, a);
          return n?.length || console.warn(t + " --\x3e Elements not found: " + e), n || []
        },
        setClassName(e, t) {
          this.classNameRegistry[e] = t
        },
        getClassName(e) {
          return this.classNameRegistry[e] || ""
        },
        clearCache() {
          this.elementCache.clear()
        }
      }
    }
  };
//# sourceMappingURL=element-managers.min.js.map