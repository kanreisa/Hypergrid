/*!
 * Hypergrid/1.2 for Prototype.js
 *
 * Copyright (c) 2011 Yuki KAN
 * Licensed under the MIT-License.
 *
 * Powered by SAKURA Internet Inc.
 *
 * http://akkar.in/projects/hypergrid/
**/
var Hypergrid = Class.create({
	/**
	 * Constructor
	**/
	initialize: function(pParam){
		this.colModel       = pParam.colModel       || [];
		this.rows           = pParam.rows           || [];
		this.tableID        = pParam.tableID        || null;
		this.tableClass     = pParam.tableClass     || 'hypergrid';
		this.tableWidth     = pParam.tableWidth     || 'auto';
		this.tableHeight    = pParam.tableHeight    || 'auto';
		this.tableStyle     = pParam.tableStyle     || {};
		this.colMinWidth    = pParam.colMinWidth    || 20;
		this.multiSelect    = pParam.multiSelect    || false;
		this.disableCheckbox= pParam.disableCheckbox|| false;
		this.disableSelect  = pParam.disableSelect  || false;
		this.disableSort    = pParam.disableSort    || false;
		this.disableResize  = pParam.disableResize  || false;
		this.strSortAsc     = pParam.strSortAsc     || '&#x25B2;';//BLACK UP-POINTING TRIANGLE
		this.strSortDesc    = pParam.strSortDesc    || '&#x25BC;';//BLACK DOWN-POINTING TRIANGLE
		this.onRendered     = pParam.onRendered     || null;
		this.onBeforeSort   = pParam.onBeforeSort   || null;
		this.onSort         = pParam.onSort         || null;
		
		//init checkbox
		if((this.disableCheckbox === false) && (this.multiSelect === true) && (this.disableSelect === false)){
			//create master checkbox
			this._checkbox = {
				master: document.createElement('input')
			};
			this._checkbox.master.setAttribute('type', 'checkbox');
			this._checkbox.master.style.cursor  = 'pointer';
			this._checkbox.master.style.padding = '0';
			this._checkbox.master.checked = false;
			
			//insert checkbox to colModel
			this.colModel = [
				{
					key      : '_hypergridCheckbox',
					width    : 20,
					align    : 'center',
					style    : {padding:0},
					innerHTML: this._checkbox.master,
					onClick  : function(){
						if(this._checkbox.master.checked === false){
							this.selector('unselectAll');
						}else{
							this.selector('selectAll');
						}
					}.bind(this)
				}
			].concat(this.colModel);
			
			//insert checkbox to rows
			this.rows.each(function(row, i){
				//clone from master checkbox
				this._checkbox['row-' + i] = this._checkbox.master.cloneNode(true);
				
				row.cell._hypergridCheckbox = {
					style    : {padding:0},
					innerHTML: this._checkbox['row-' + i]
				};
			}.bind(this));
		}
		
		//init sort triangle
		if(this.disableSort === false){
			//create original triangles
			this._sortTriangle = {
				originAsc: new Element('span', {
					className: 'hypergrid-sort-triangle hypergrid-asc'
				}).update(this.strSortAsc)
				,
				originDesc: new Element('span', {
					className: 'hypergrid-sort-triangle hypergrid-desc'
				}).update(this.strSortDesc)
			};
			
			//insert triangles to colModel
			this.colModel.each(function(col, i){
				if(col.key == '_hypergridCheckbox'){
					return;//continue
				}
				col._statusSort = {
					isActive  : false,
					isOrderAsc: true
				};
			}.bind(this));
		}
	}//<--initialize()
	,
	/**
	 * Render
	**/
	render: function(pElement){
		//create container
		var target = document.createElement('div');
		target.setAttribute('class', 'hypergrid-container');
		
		//insert container to render element
		if($(pElement).innerHTML.empty() === false){
			try{
				$(pElement).innerHTML = '';
			}catch(e){
				$(pElement).update();
			}
		}
		$(pElement).appendChild(target);
		
		//create table element
		var table = this._table = document.createElement('table');
		table.setAttribute('id', this.tableID);
		table.setAttribute('class', this.tableClass);
		
		var styles = this.tableStyle || {};
		styles.width  = Object.isNumber(this.tableWidth) ? this.tableWidth + 'px' : this.tableWidth;
		styles.height = Object.isNumber(this.tableHeight) ? this.tableHeight + 'px' : this.tableHeight;
		table.setStyle(styles);
		
		//insert table to target
		target.appendChild(table);
		
		//create thead element
		var thead = document.createElement('thead');
		
		//insert thead to table
		table.appendChild(thead);
		
		//create tbody element
		var tbody = document.createElement('tbody');
		
		//insert tbody to table
		table.appendChild(tbody);
		
		//column model
		if(typeof this.colModel[0].key != 'undefined'){
			var r = document.createElement('tr');//insert row
			thead.appendChild(r);
			
			//
			//render column header
			//
			this.colModel.each(function(col, i){
				//fix innerHTML
				var innerHTML = col.innerHTML || '';
				if(col._statusSort && ((typeof col.width == 'undefined') || (col.width > 20))){
					//fix triangle
					if(col._statusSort.isOrderAsc){
						var triangle = this._sortTriangle.originAsc.cloneNode(true);
					}else{
						var triangle = this._sortTriangle.originDesc.cloneNode(true);
					}
					if(col._statusSort.isActive){
						triangle.addClassName('hypergrid-active');
					}
					
					//add event listener
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
						
						//redraw
						this.render(pElement);
					}.bind(this));
					
					//insert triangle
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
				
				//create th element
				var th = col._th = document.createElement('th');
				
				//set title attr
				if(col.title) th.setAttribute('title', col.title);
				
				//set styles
				var styles = col.style || {};
				if(col.onClick) styles.cursor = 'pointer';
				styles.textAlign     = col.align  || 'left';
				styles.verticalAlign = col.valign || 'middle';
				styles.width         = (col.width) ? (col.width + 'px') : 'auto';
				styles.minWidth      = this.colMinWidth + 'px';
				th.setStyle(styles);
				
				//onClick event
				if(col.onClick){
					th.observe('click', function(e){
						col.onClick(e);
					});
				}
				
				//innerHTML
				if(Object.isElement(innerHTML) === true){
					if(innerHTML.type == 'checkbox'){
						var contentContainer = document.createElement('div');
						contentContainer.appendChild(innerHTML);
						th.appendChild(contentContainer);
					}else{
						th.appendChild(innerHTML);
					}
				}else{
					var contentContainer = document.createElement('div');
					contentContainer.innerHTML = innerHTML;
					th.appendChild(contentContainer);
				}
				
				//insert th to tr
				r.appendChild(th);
				
				//adjust size by browser
				if(Prototype.Browser.WebKit === true){
					if(col.width && (this.tableWidth !== 'auto') && (table.getStyle('table-layout') === 'fixed')){
						//set style to th
						th.style.width = (
							col.width +
							parseInt(th.getStyle('padding-left').replace('px', ''), 10) +
							parseInt(th.getStyle('padding-right').replace('px', ''), 10) +
							parseInt(th.getStyle('border-left-width').replace('px', ''), 10)
						) + 'px';
					}
				}
			}.bind(this));//<--#each
		}//<--if
		
		//rows
		this.rows.each(function(row, i){
			//create tr element
			var r = row._tr = document.createElement('tr');
			if(row.id)    r.setAttribute('id', row.id);
			if(row.title) r.setAttribute('title', row.title);
			
			//set styles
			var styles = row.style || {};
			if((row.onClick) || (row.onDblClick) || ((this.disableSelect === false) ? (row.onSelect) : false)){
				styles.cursor = 'pointer';
			}
			r.setStyle(styles);
			
			//insert row to tbody
			tbody.appendChild(r);
			
			//
			//render cells
			//
			this.colModel.each(function(col, j){
				//if undefined
				if(typeof row.cell[col.key] == 'undefined') row.cell[col.key] = {};
				
				//create td element
				var td = document.createElement('td');
				
				//set title attr
				if(row.cell[col.key].title) td.setAttribute('title', row.cell[col.key].title);
				
				//set styles
				var styles = row.cell[col.key].style || {};
				if(row.cell[col.key].onClick) styles.cursor = 'pointer';
				styles.textAlign     = row.cell[col.key].align || col.align || 'left';
				styles.verticalAlign = row.cell[col.key].valign|| col.valign|| 'middle';
				styles.width         = (row.cell[col.key].width) ? (row.cell[col.key].width + 'px') : 'auto';
				td.setStyle(styles);
				
				//onClick event
				if(row.cell[col.key].onClick){
					td.observe('click', function(e){
						row.cell[col.key].onClick(this, e);
					});
				}
				
				//innerHTML
				if(row.cell[col.key].innerHTML){
					//create container
					var contentContainer = document.createElement('div');
					td.appendChild(contentContainer);
					
					//insertion
					if(Object.isElement(row.cell[col.key].innerHTML) === true){
						contentContainer.appendChild(row.cell[col.key].innerHTML);
					}else{
						contentContainer.innerHTML = row.cell[col.key].innerHTML;
					}
				}
				
				//adjust size by browser
				if(Prototype.Browser.WebKit === true){
					if(
						row.cell[col.key].width &&
						(this.tableWidth !== 'auto') && (table.getStyle('table-layout') === 'fixed')
					){
						td.setStyle({
							width: (
								row.cell[col.key].width +
								parseInt(td.getStyle('padding-left').replace('px', ''), 10) +
								parseInt(td.getStyle('padding-right').replace('px', ''), 10) +
								parseInt(td.getStyle('border-left-width').replace('px', ''), 10)
							) + 'px'
						});
					}//<--if
				}
				
				//insert td to tr
				r.appendChild(td);
			}.bind(this));//<--#each
			
			//
			//click Event
			//
			r.observe('click', function(pEvent){
				//call user function
				if(row.onClick) row.onClick(r, pEvent);
				
				//selection
				if(this.disableSelect === false){
					if(this.multiSelect === true){
						if(r.hasClassName('selected') === true){
							this.selector('unselect', r, function(){
								if(row.onUnSelect) row.onUnSelect(r, pEvent);//call user function
							});
						}else{
							this.selector('select', r, function(){
								if(row.onSelect) row.onSelect(r, pEvent);//call user function
							});
						}
					}else{
						//if selected this row, just unselect only.
						var clearOnly = false;
						if(r.hasClassName('selected') === true) clearOnly = true;
						
						//unselect all rows
						this.selector('unselectAll');
						
						if(clearOnly === false){
							this.selector('select', r, function(){
								if(row.onSelect) row.onSelect(r, pEvent);//call user function
							});
						}
					}//<--if
				}//<--if
			}.bind(this));//<--#observe
			
			//
			//dblClick Event
			//
			if(row.onDblClick){
				r.observe('dblclick', function(e){
					row.onDblClick(r, e);
				});
			}
		}.bind(this));//<--#each
		
		//resizing
		if(this.disableResize === false){
			//reposition
			var repositionResizeBars = function(){
				this.colModel.each(function(col, i){
					//break on last column
					if((i + 1) === this.colModel.length){
						throw $break;
					}
					
					//set style
					col._rbar.style.left = (col._th.positionedOffset().left + col._th.getWidth()) + 'px';
				}.bind(this));//<--#each
			}.bind(this);
			
			//init
			this.colModel.each(function(col, i){
				//break on last column
				if((i + 1) === this.colModel.length){
					throw $break;
				}
				
				//resize bar
				var rbar = col._rbar = document.createElement('div');
				rbar.setAttribute('class', 'hypergrid-resize-bar');
				rbar.style.left = (col._th.positionedOffset().left + col._th.getWidth()) + 'px';
				
				//insert bar to table
				table.appendChild(rbar);
				
				//observe mousedown event
				rbar.observe('mousedown', function(e){
					var positionedX = e.clientX;//save cursor position
					var beforePos   = parseInt(rbar.getStyle('left').replace('px', ''), 10); 
					
					rbar.addClassName('hypergrid-resize-bar-visible');
					
					//mousemove event
					var onMove = function(e){
						var transfers = e.clientX - positionedX;//calc
						rbar.style.left = (transfers + parseInt(rbar.getStyle('left').replace('px', ''), 10)) + 'px';
						
						positionedX = e.clientX;//save cursor position
						
						//stop default event
						e.stop();
						return false;
					};//<--onMove()
					
					//mouseup event
					var onUp = function(e){
						rbar.removeClassName('hypergrid-resize-bar-visible');
						
						var resize = parseInt(rbar.getStyle('left').replace('px', ''), 10) - beforePos;
						
						col.width = (
							resize + col._th.getWidth() -
							parseInt(col._th.getStyle('padding-left').replace('px', ''), 10) -
							parseInt(col._th.getStyle('padding-right').replace('px', ''), 10) -
							((i === 0) ? 0 : 1)
						);
						
						col._th.style.width = col.width + 'px';
						
						//remove width style of right column
						this.colModel[i + 1]._th.style.width = 'auto';
						delete this.colModel[i + 1].width;
						
						//adjust size by browser
						if(Prototype.Browser.WebKit === true){
							if((this.tableWidth !== 'auto') && (table.getStyle('table-layout') === 'fixed')){
								//set style to th
								col._th.style.width = (
									col.width +
									parseInt(col._th.getStyle('padding-left').replace('px', ''), 10) +
									parseInt(col._th.getStyle('padding-right').replace('px', ''), 10) +
									parseInt(col._th.getStyle('border-left-width').replace('px', ''), 10)
								) + 'px';
							}
						}
						
						repositionResizeBars();
						
						//stop observing events
						$(document.body).stopObserving('mousemove', onMove);
						$(document.body).stopObserving('mouseup', onUp);
						
						//stop default event
						e.stop();
						return false;
					}.bind(this);//<--onUp()
					
					//observe events
					$(document.body).observe('mousemove', onMove);
					$(document.body).observe('mouseup', onUp);
					
					//stop default event
					e.stop();
					return false;
				}.bind(this));//<--#observe
			}.bind(this));//<--#each
			
			Event.observe(window, 'resize', function(){
				setTimeout(repositionResizeBars, 500);
			});
		}//<--if
		
		//onRendered Event
		if(this.onRendered !== null){
			this.onRendered();
		}
	}//<--render()
	,
	/**
	 * selector
	**/
	selector: function(pAct, pElement, pFunc){
		//select row
		if(pAct == 'select'){
			//add 'selected' className
			pElement.addClassName('selected');
			
			//checkbox
			if(this._checkbox){
				//check
				pElement.childElements()[0].childElements()[0].childElements()[0].checked = true;
				this._checkbox.master.checked = true;
			}
		}
		
		//unselect row
		if(pAct == 'unselect'){
			//remove 'selected' className
			pElement.removeClassName('selected');
			
			//checkbox
			if(this._checkbox){
				//uncheck
				pElement.childElements()[0].childElements()[0].childElements()[0].checked = false;
				
				//master checkbox
				var c = true;
				Object.keys(this._checkbox).without('master').each(function(key){
					if(this._checkbox[key].checked === true){
						c = false;
						throw $break;
					}
				}.bind(this));
				if(c){
					this._checkbox.master.checked = false;
				}
			}
		}
		
		//select all rows
		if(pAct == 'selectAll'){
			this.rows.each(function(row){
				//continue if already selected
				if(row._tr.hasClassName('selected') === true) return;
				
				//add 'selected' className
				row._tr.addClassName('selected');
				
				//checkbox
				if(this._checkbox){
					row._tr.childElements()[0].childElements()[0].childElements()[0].checked = true;
					this._checkbox.master.checked = true;
				}
				
				//onSelect event
				if(row.onSelect) row.onSelect();
			}.bind(this));
		}
		
		//unselect all rows
		if(pAct == 'unselectAll'){
			this.rows.each(function(row){
				//continue if already unselected
				if(!row._tr.hasClassName('selected')) return;
				
				//remove 'selected' className
				row._tr.removeClassName('selected');
				
				//checkbox
				if(this._checkbox){
					row._tr.childElements()[0].childElements()[0].childElements()[0].checked = false;
					this._checkbox.master.checked = false;
				}
				
				//onUnselect event
				if(row.onUnSelect) row.onUnSelect();
			}.bind(this));
		}
		
		//call function when finished
		if(pFunc) pFunc();
	}//<--selector()
	,
	/**
	 * sorter
	**/
	sorter: function(pKey, pOrder){
		//onBeforeSort event
		if(this.onBeforeSort !== null) this.onBeforeSort(pKey, pOrder);
		
		//run sorter
		this.rows = this.rows.sort(function(a, b){
			var result = (a.cell[pKey].innerHTML > b.cell[pKey].innerHTML);
			
			if(pOrder == 'asc'){
				return result ? 1 : -1;
			}else{
				return result ? -1 : 1;
			}
		});
		
		//onSort event
		if(this.onSort !== null) this.onSort(pKey, pOrder);
	}//<--sorter()
});