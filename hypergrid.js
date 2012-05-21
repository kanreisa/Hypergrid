/*!
 * Hypergrid/[:version] for Prototype.js
 *
 * Copyright (c) 2011 Yuki KAN
 * Licensed under the MIT-License.
 *
 * Powered by SAKURA Internet Inc.
 *
 * http://akkar.in/projects/hypergrid/
**/
var Hypergrid = Class.create({
	//
	// Constructor
	//
	initialize: function _init(opt) {
		this.colModel       = opt.colModel       || [];
		this.rows           = opt.rows           || [];
		this.tableID        = opt.tableID        || null;
		this.tableClass     = opt.tableClass     || 'hypergrid';
		this.tableWidth     = opt.tableWidth     || 'auto';
		this.tableHeight    = opt.tableHeight    || 'auto';
		this.tableStyle     = opt.tableStyle     || {};
		this.colMinWidth    = opt.colMinWidth    || 20;
		this.multiSelect    = opt.multiSelect    || false;
		this.disableCheckbox= opt.disableCheckbox|| false;
		this.disableSelect  = opt.disableSelect  || false;
		this.disableSort    = opt.disableSort    || false;
		this.disableResize  = opt.disableResize  || false;
		this.strSortAsc     = opt.strSortAsc     || '&#x25B2;';//BLACK UP-POINTING TRIANGLE
		this.strSortDesc    = opt.strSortDesc    || '&#x25BC;';//BLACK DOWN-POINTING TRIANGLE
		this.onRendered     = opt.onRendered     || null;
		this.onBeforeSort   = opt.onBeforeSort   || null;
		this.onSort         = opt.onSort         || null;
		
		this.initCheckbox();
		
		// init sort triangle
		if (this.disableSort === false) {
			// create original triangles
			this._sortTriangle = {
				originAsc : document.createElement('span'),
				originDesc: document.createElement('span')
			};
			this._sortTriangle.originAsc.className  = 'hypergrid-sort-triangle hypergrid-asc';
			this._sortTriangle.originAsc.innerHTML  = this.strSortAsc;
			this._sortTriangle.originDesc.className = 'hypergrid-sort-triangle hypergrid-desc';
			this._sortTriangle.originDesc.innerHTML = this.strSortDesc;
			
			// insert triangles to colModel
			this.colModel.each(function(col, i) {
				if (col.key === '_hypergridCheckbox') {
					return;//continue
				}
				col._statusSort = {
					isActive  : false,
					isOrderAsc: true
				};
			}.bind(this));
		}
		
		return this;
	}//<--initialize()
	,
	//
	// initCheckbox
	//
	initCheckbox: function _initCheckbox() {
		// init checkbox
		var isDrawCheckbox = (
			(this.disableCheckbox === false) &&
			(this.disableSelect === false) &&
			(this.multiSelect === true)
		);
		if (isDrawCheckbox) {
			// create source
			var checkboxSource = document.createElement('input');
			checkboxSource.type    = 'checkbox';
			checkboxSource.checked = false;
			
			// master checkbox
			this._checkbox = {
				master: checkboxSource.cloneNode(true)
			};
			this._checkbox.master.observe('click', function() {
				if (this._checkbox.master.checked === false) {
					this.selector('unselectAll');
				} else {
					this.selector('selectAll');
				}
			}.bind(this));
			
			// insert master to colModel
			this.colModel = [
				{
					key      : '_hypergridCheckbox',
					width    : 20,
					align    : 'center',
					style    : { padding: 0 },
					innerHTML: this._checkbox.master
				}
			].concat(this.colModel);
			
			// insert checkbox to rows
			this.rows.each(function(row, i) {
				// clone from master checkbox
				var key = 'row-' + i.toString(10);
				this._checkbox[key] = checkboxSource.cloneNode(true);
				
				row.cell._hypergridCheckbox = {
					style    : { padding: 0 },
					innerHTML: this._checkbox[key]
				};
			}.bind(this));
		}
		
		return this;
	}//<--initCheckbox()
	,
	//
	// render
	//
	render: function _render(targetElement) {
		// create container
		var target = document.createElement('div');
		target.className = 'hypergrid-container';
		
		// restoration
		if (!targetElement && this._lastTargetElement) {
			var targetElement = this._lastTargetElement;
		}
		
		// insert container to render element
		if ($(targetElement).innerHTML.empty() === false) {
			try {
				$(targetElement).innerHTML = '';
			} catch(e) {
				$(targetElement).update();
			}
		}
		$(targetElement).appendChild(target);
		
		this._lastTargetElement = targetElement;
		
		// create table element
		var table = this._table = document.createElement('table');
		table.id        = this.tableID;
		table.className = this.tableClass;
		
		var styles = this.tableStyle || {};
		styles.width  = Object.isNumber(this.tableWidth) ? this.tableWidth + 'px' : this.tableWidth;
		styles.height = Object.isNumber(this.tableHeight) ? this.tableHeight + 'px' : this.tableHeight;
		table.setStyle(styles);
		
		// insert table to target
		target.appendChild(table);
		
		// create thead element
		var thead = document.createElement('thead');
		
		// insert thead to table
		table.appendChild(thead);
		
		// create tbody element
		var tbody = document.createElement('tbody');
		
		// insert tbody to table
		table.appendChild(tbody);
		
		// column model
		if(typeof this.colModel[0].key != 'undefined'){
			var r = document.createElement('tr');//insert row
			thead.appendChild(r);
			
			//
			// render column header
			//
			this.colModel.each(function(col, i){
				// fix innerHTML
				var innerHTML = col.innerHTML || '';
				if(col._statusSort && ((typeof col.width == 'undefined') || (col.width > 20))){
					// fix triangle
					if(col._statusSort.isOrderAsc){
						var triangle = this._sortTriangle.originAsc.cloneNode(true);
					}else{
						var triangle = this._sortTriangle.originDesc.cloneNode(true);
					}
					if(col._statusSort.isActive){
						triangle.addClassName('hypergrid-active');
					}
					
					// add event listener
					triangle.observe('click', function(e){
						//unselect all
						this.selector('unselectAll');
						
						//proc sort
						this.sorter(col.key, (col._statusSort.isOrderAsc) ? 'desc' : 'asc');
						
						//update status
						col._statusSort.isOrderAsc = (col._statusSort.isOrderAsc) ? false : true;
						this.colModel.each(function(col, i){
							if(col._statusSort){
								col._statusSort.isActive = false;
							}
						});
						col._statusSort.isActive = true;
						
						// redraw
						this.render(targetElement);
					}.bind(this));
					
					// insert triangle
					innerHTML = new Element('div').insert(
						new Element('span').insert(
							col.innerHTML || ''
						).setStyle({
							marginRight : '10px'
						})
					).setStyle({
						paddingRight : '1px'
					}).insert(
						triangle
					);
				}//<--if
				
				// create th element
				var th = col._th = document.createElement('th');
				
				if (Prototype.Browser.WebKit === true) {
					col.setWidth = function (width) {
						if (width) {
							if ((this.tableWidth !== 'auto') && (table.getStyle('table-layout') === 'fixed')) {
								// set style to th
								th.style.width = (
									width +
									parseInt(th.getStyle('padding-left').replace('px', ''), 10) +
									parseInt(th.getStyle('padding-right').replace('px', ''), 10) +
									parseInt(th.getStyle('border-right-width').replace('px', ''), 10) +
									parseInt(th.getStyle('border-left-width').replace('px', ''), 10)
								) + 'px';
							} else {
								th.style.width = width + 'px';
							}
							col.width = width;
						} else {
							th.style.width = 'auto';
							delete col.width;
						}
					};
					col.getWidth = function () {
						return th.getWidth();
					};
				} else {
					col.setWidth = function (width) {
						if (width) {
							col.width = width;
							th.style.width = col.width + 'px';
						} else {
							th.style.width = 'auto';
							delete col.width;
						}
					};			
				}
				
				col.getWidth = function () {
					return th.getWidth() -
					parseInt(th.getStyle('padding-left').replace('px', ''), 10) -
					parseInt(th.getStyle('padding-right').replace('px', ''), 10) -
					parseInt(th.getStyle('border-right-width').replace('px', ''), 10) -
					parseInt(th.getStyle('border-left-width').replace('px', ''), 10);
				};
				
				// set title attr
				if (col.title) {
					th.title = col.title;
				}
				
				// set styles
				var styles = col.style || {};
				if (col.onClick) {
					styles.cursor = 'pointer';
				}
				styles.textAlign     = col.align  || 'left';
				styles.verticalAlign = col.valign || 'middle';
				styles.minWidth      = this.colMinWidth + 'px';
				th.setStyle(styles);
				
				// onClick event
				if (col.onClick) {
					th.observe('click', function(e) {
						col.onClick(e);
					});
				}
				
				// innerHTML
				if (Object.isElement(innerHTML) === true) {
					if (innerHTML.type == 'checkbox') {
						var contentContainer = document.createElement('div');
						contentContainer.appendChild(innerHTML);
						th.appendChild(contentContainer);
					} else {
						th.appendChild(innerHTML);
					}
				} else {
					var contentContainer = document.createElement('div');
					contentContainer.innerHTML = innerHTML;
					th.appendChild(contentContainer);
				}
				
				// insert th to tr
				r.appendChild(th);
				
				col.setWidth(col.width);
			}.bind(this));//<--#each
		}//<--if
		
		// rows
		this.rows.each(function(row, i) {
			// create tr element
			var r = row._tr = document.createElement('tr');
			if (row.id) {
				r.id = row.id;
			}
			if (row.title) {
				r.title = row.title;
			}
			if (i % 2 === 0) {
				r.className = 'hypergrid-odd';
			}
			
			// set styles
			var styles = row.style || {};
			var isEnableEvent = (
				(row.onClick) || (row.onDblClick) ||
				((this.disableSelect === false) ? (row.onSelect) : false)
			);
			if (isEnableEvent) {
				styles.cursor = 'pointer';
			}
			r.setStyle(styles);
			
			// insert row to tbody
			tbody.appendChild(r);
			
			//
			// render cells
			//
			this.colModel.each(function(col, j) {
				// if undefined
				if (typeof row.cell[col.key] === 'undefined') {
					row.cell[col.key] = {};
				}
				
				// create td element
				var td = document.createElement('td');
				
				// set title attr
				if (row.cell[col.key].title) {
					td.title = row.cell[col.key].title;
				}
				
				// set styles
				var styles = row.cell[col.key].style || {};
				if (row.cell[col.key].onClick) {
					styles.cursor = 'pointer';
				}
				styles.textAlign     = row.cell[col.key].align || col.align || 'left';
				styles.verticalAlign = row.cell[col.key].valign|| col.valign|| 'middle';
				styles.width         = (row.cell[col.key].width) ? (row.cell[col.key].width + 'px') : 'auto';
				td.setStyle(styles);
				
				// onClick event
				if (row.cell[col.key].onClick) {
					td.observe('click', function(e) {
						row.cell[col.key].onClick(this, e);
					});
				}
				
				//innerHTML
				if (row.cell[col.key].innerHTML) {
					//create container
					var contentContainer = document.createElement('div');
					td.appendChild(contentContainer);
					
					//insertion
					if (Object.isElement(row.cell[col.key].innerHTML) === true) {
						contentContainer.appendChild(row.cell[col.key].innerHTML);
					} else {
						contentContainer.innerHTML = row.cell[col.key].innerHTML;
					}
				}
				
				// adjust size (webkit)
				if (Prototype.Browser.WebKit === true) {
					var isAdjustRequired = (
						(row.cell[col.key].width) &&
						(this.tableWidth !== 'auto') &&
						(table.getStyle('table-layout') === 'fixed')
					);
					if (isAdjustRequired) {
						td.setStyle({
							width: (
								row.cell[col.key].width +
								parseInt(td.getStyle('padding-left').replace('px', ''), 10) +
								parseInt(td.getStyle('padding-right').replace('px', ''), 10) +
								parseInt(td.getStyle('border-left-width').replace('px', ''), 10) +
								parseInt(td.getStyle('border-right-width').replace('px', ''), 10)
							) + 'px'
						});
					}//<--if
				}//<--if
				
				// insert td to tr
				r.appendChild(td);
			}.bind(this));//<--#each
			
			//
			// click Event
			//
			r.observe('click', function(e) {
				// call user function
				if (row.onClick) {
					row.onClick(r, e);
				}
				
				// selection
				if (this.disableSelect === false) {
					if (this.multiSelect === true) {
						if (r.hasClassName('selected') === true) {
							this.selector('unselect', r, function() {
								// call user function
								if (row.onUnSelect) {
									row.onUnSelect(r, e);
								}
							});
						}else{
							this.selector('select', r, function() {
								if (row.onSelect) {
									row.onSelect(r, e);//call user function
								}
							});
						}
					} else {
						// if selected this row, just unselect only.
						var clearOnly = false;
						if (r.hasClassName('selected') === true) {
							clearOnly = true;
						}
						
						// unselect all rows
						this.selector('unselectAll');
						
						if (clearOnly === false) {
							this.selector('select', r, function() {
								if (row.onSelect) {
									row.onSelect(r, e);//call user function
								}
							});
						}
					}//<--if
				}//<--if
			}.bind(this));//<--#observe
			
			//
			// dblClick Event
			//
			if (row.onDblClick) {
				r.observe('dblclick', function(e) {
					row.onDblClick(r, e);
				});
			}
		}.bind(this));//<--#each
		
		// resizing
		if (this.disableResize === false) {
			// reposition
			var repositionResizeBars = function() {
				this.colModel.each(function(col, i) {
					// break on last column
					if ((i + 1) === this.colModel.length) {
						throw $break;
					}
					
					// set style
					col._rbar.style.left = (col._th.positionedOffset().left + col._th.getWidth()) + 'px';
				}.bind(this));//<--#each
			}.bind(this);
			
			// init
			this.colModel.each(function(col, i) {
				// break on last column
				if ((i + 1) === this.colModel.length) {
					throw $break;
				}
				//resize bar
				var rbar = col._rbar = document.createElement('div');
				rbar.className = 'hypergrid-resize-bar';
				rbar.style.left = (col._th.positionedOffset().left + col._th.getWidth()) + 'px';
				
				// insert bar to table
				table.appendChild(rbar);
				
				var positionedX, beforePos; //closures
				var that = this;
				var getRbarPositionAndDisplay = function(e) {
					positionedX = e.clientX;//save cursor position
					beforePos = parseInt(rbar.getStyle('left').replace('px', ''), 10);
					rbar.addClassName('hypergrid-resize-bar-visible');
					
					// observe dragging
					$(document.body).observe('mousemove', moveRbarWithCursor);
					$(document.body).observe('mouseup', onUp);
					
					// stop default event
					e.stop();
					return false;
				};
				
				var moveRbarWithCursor = function(e) {
					var transfers = e.clientX - positionedX;//calc
					rbar.style.left = (transfers + parseInt(rbar.getStyle('left').replace('px', ''), 10)) + 'px';
						
					positionedX = e.clientX;//save cursor position
					
					// stop default event
					e.stop();
					return false;
				};
				
				var onUp = function(e) {
					var colModel = that.colModel; // this makes referencing faster
					Event.stopObserving(document.body, 'mousemove', moveRbarWithCursor);
					Event.stopObserving(document.body, 'mouseup', onUp);
					
					rbar.removeClassName('hypergrid-resize-bar-visible');
					var currentColWidth = [];
					for (var j = i; j < colModel.length; j++) {
						currentColWidth[j] = colModel[j].getWidth();
					}
					
					var resize = parseInt(rbar.getStyle('left').replace('px', ''), 10) - beforePos;
					resize = Math.max(
						resize,
						((colModel[i].minWidth ? colModel[i].minWidth : that.colMinWidth ) - currentColWidth[i])
					);
					
					// resize right colmun
					var rest = -resize % (colModel.length - i - 1);
					var delta = (-resize-rest) / (colModel.length - i - 1);
					var fixedWidth;
					for (var j = colModel.length -1; j > i + 1; j--) {
						fixedWidth = Math.max(
							(colModel[j].minWidth ? colModel[j].minWidth : that.colMinWidth),
							(delta + currentColWidth[j])
						);
						colModel[j].setWidth(fixedWidth);
						rest += delta - (fixedWidth - currentColWidth[j]);
					}
					
					fixedWidth = Math.max(
						(colModel[j].minWidth ? colModel[j].minWidth : that.colMinWidth),
						(delta + rest + currentColWidth[j])
					);
					that.colModel[j].setWidth(fixedWidth);
					rest = delta + rest - (fixedWidth - currentColWidth[j]);
					col.setWidth(resize + rest + currentColWidth[i]);
					
					repositionResizeBars();
					
					// stop default event
					e.stop();
					return false;
				};
				
				// observe mousedown event
				rbar.observe('mousedown', getRbarPositionAndDisplay);
			}.bind(this));
			
			Event.observe(window, 'resize', function() {
				setTimeout(repositionResizeBars, 500);
			});
		}//<--if
		
		// onRendered Event
		if (this.onRendered !== null) {
			this.onRendered();
		}
		
		return this;
	}//<--render()
	,
	//
	// selector
	//
	selector: function _selector(action, targetElement, callback) {
		var isDrawCheckbox = (
			(this.disableCheckbox === false) &&
			(this.disableSelect === false) &&
			(this.multiSelect === true)
		);
		
		// select row
		if (action === 'select') {
			// add 'selected' className
			targetElement.addClassName('selected');
			
			// checkbox
			if (isDrawCheckbox) {
				// check
				targetElement.childElements()[0].childElements()[0].childElements()[0].checked = true;
				this._checkbox.master.checked = true;
			}
		}
		
		// unselect row
		if (action === 'unselect') {
			// remove 'selected' className
			targetElement.removeClassName('selected');
			
			// checkbox
			if (isDrawCheckbox) {
				// uncheck
				targetElement.childElements()[0].childElements()[0].childElements()[0].checked = false;
				
				// master checkbox
				var isChecked = true;
				Object.keys(this._checkbox).without('master').each(function(key) {
					if (this._checkbox[key].checked === true) {
						isChecked = false;
						throw $break;
					}
				}.bind(this));
				if (isChecked) {
					this._checkbox.master.checked = false;
				}
			}
		}
		
		// select all rows
		if (action === 'selectAll') {
			this.rows.each(function(row) {
				// continue if already selected
				if (row._tr.hasClassName('selected') === true) {
					return;//continue
				}
				
				// add 'selected' className
				row._tr.addClassName('selected');
				
				// checkbox
				if (isDrawCheckbox) {
					row._tr.childElements()[0].childElements()[0].childElements()[0].checked = true;
					this._checkbox.master.checked = true;
				}
				
				// onSelect event
				if (row.onSelect) {
					row.onSelect();
				}
			}.bind(this));
		}
		
		// unselect all rows
		if (action === 'unselectAll') {
			this.rows.each(function(row) {
				// continue if already unselected
				if (row._tr.hasClassName('selected') === false) {
					return;
				}
				
				// remove 'selected' className
				row._tr.removeClassName('selected');
				
				// checkbox
				if (isDrawCheckbox) {
					row._tr.childElements()[0].childElements()[0].childElements()[0].checked = false;
					this._checkbox.master.checked = false;
				}
				
				// onUnselect event
				if (row.onUnSelect) {
					row.onUnSelect();
				}
			}.bind(this));
		}
		
		// callback when finished
		if (callback) {
			callback();
		}
		
		return this;
	}//<--selector()
	,
	//
	// sorter
	//
	sorter: function _sorter(key, order) {
		// onBeforeSort event
		if (this.onBeforeSort !== null) this.onBeforeSort(key, order);
		
		// run sorter
		this.rows = this.rows.sort(function(a, b) {
			var result = (a.cell[key].innerHTML > b.cell[key].innerHTML);
			
			if (order === 'asc') {
				return result ? 1 : -1;
			}else{
				return result ? -1 : 1;
			}
		});
		
		//onSort event
		if (this.onSort) {
			this.onSort(key, order);
		}
		
		return this;
	}//<--sorter()
});
