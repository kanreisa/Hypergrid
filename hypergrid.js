/*!
 * Hypergrid/0.9 for Prototype.js
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
		this.onRendered    = pParam.onRendered    || null;
		this.colModel      = pParam.colModel      || [];
		this.rows          = pParam.rows          || [];
		this.tableID       = pParam.tableID       || null;
		this.tableClass    = pParam.tableClass    || 'hypergrid';
		this.tableWidth    = pParam.tableWidth    || 'auto';
		this.tableHeight   = pParam.tableHeight   || 'auto';
		this.colMinWidth   = pParam.colMinWidth   || 20;
		this.multiSelect   = pParam.multiSelect   || false;
		this.useCheckbox   = pParam.useCheckbox   || true;
		this.disableSelect = pParam.disableSelect || false;
		this.disableSort   = pParam.disableSort   || false;
		this.strSortAsc    = pParam.strSortAsc    || '&#x25B2;';//BLACK UP-POINTING TRIANGLE
		this.strSortDesc   = pParam.strSortDesc   || '&#x25BC;';//BLACK DOWN-POINTING TRIANGLE
		//this.striped       = pParam.striped       || true;
		//this.minHeight     = pParam.minHeight     || 80;
		//this.resizable     = pParam.resizable     || false;
		//showToggleBtn: true, //show or hide column toggle popup
		
		//init checkbox
		if(this.useCheckbox && this.multiSelect){
			//create master checkbox
			this._checkbox = {
				master: new Element('input', {
					type : 'checkbox'
				})
			};
			
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
	}
	,
	/**
	 * Render
	**/
	render: function(pElement){
		var target = $(pElement);//target element
		
		//create table element
		var table = this._table = new Element('table', {
			id       : this.tableID,//set id
			width    : this.tableWidth,//set width
			height   : this.tableHeight,//set height
			className: this.tableClass//set className
		});
		
		//insert table to target
		target.update(table);
		
		//column model
		if(typeof this.colModel[0].key != 'undefined'){
			var r = $(table.insertRow(-1));//insert row
			//
			//render column header
			//
			this.colModel.each(function(col, i){
				//adjust size by browser
				if(Prototype.Browser.WebKit === false){
					if(col.width && (!col._fixedWidth)){
						col.width       = col.width - 10;
						col._fixedWidth = true;
					}
				}
				
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
					triangle.observe('click', function(){
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
						col.innerHTML || ''
					).insert(
						triangle
					);
				}
				
				//create th element
				r.insert(
					new Element('th', {
						width : col.width || 'auto',
						align : col.align || 'left',
						valign: col.valign|| 'middle',
						title : col.title || ''
					}).setStyle(
						col.style || {}
					).setStyle({
						minWidth: this.colMinWidth + 'px'
					}).update(
						innerHTML
					).observe('click', function(e){
						//onClick Event
						if(col.onClick) col.onClick(e);
					})
				);
			}.bind(this));
		}
		
		//rows
		this.rows.each(function(row, i){
			var r = row._tr = $(table.insertRow(-1));//insert row
			r.id    = row.id    || null;//set id
			r.title = row.title || '';//set title
			//
			//render cells
			//
			this.colModel.each(function(col, j){
				//if undefined
				if(typeof row.cell[col.key] == 'undefined') row.cell[col.key] = {};
				//adjust size by browser
				if(Prototype.Browser.WebKit === false){
					if(row.cell[col.key].width && (!row.cell[col.key]._fixedWidth)){
						row.cell[col.key].width       = row.cell[col.key].width - 10;
						row.cell[col.key]._fixedWidth = true;
					}
					if(col.width && (!col._fixedWidth)){
						col.width       = col.width - 10;
						col._fixedWidth = true;
					}
				}
				//create td element
				r.insert(
					new Element('td', {
						width : row.cell[col.key].width || col.width || 'auto',
						align : row.cell[col.key].align || col.align || 'left',
						valign: row.cell[col.key].valign|| col.valign|| 'middle',
						title : row.cell[col.key].title || ''
					}).setStyle(
						row.cell[col.key].style || {}
					).update(
						row.cell[col.key].innerHTML || ''
					).observe('click', function(pEvent){
						//call user function
						if(row.cell[col.key].onClick) row.cell[col.key].onClick(this, pEvent);
					})
				);
			});
			//
			//click Event
			//
			r.observe('click', function(pEvent){
				//call user function
				if(row.onClick) row.onClick(r, pEvent);
				//selection
				if(this.disableSelect === false){
					if(this.multiSelect === true){
						if(r.hasClassName('selected')){
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
						var clear = false;
						if(r.hasClassName('selected')) clear = true;
						//unselect all rows
						this.selector('unselectAll');
						
						if(clear === false){
							this.selector('select', r, function(){
								if(row.onSelect) row.onSelect(r, pEvent);//call user function
							});
						}
					}
				}
			}.bind(this));
			//
			//dblClick Event
			//
			r.observe('dblclick', function(pEvent){
				//call user function
				if(row.onDblClick) row.onDblClick(r, pEvent);
			}.bind(this));
		}.bind(this));
		
		//onRendered Event
		if(this.onRendered){
			this.onRendered();
		}
	}
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
				pElement.childElements()[0].childElements()[0].checked = true;
				this._checkbox.master.checked = true;
			}
		}
		
		//unselect row
		if(pAct == 'unselect'){
			//remove 'selected' className
			pElement.removeClassName('selected');
			//checkbox
			if(this._checkbox){
				pElement.childElements()[0].childElements()[0].checked = false;
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
				if(row._tr.hasClassName('selected')) return;
				//add 'selected' className
				row._tr.addClassName('selected');
				//checkbox
				if(this._checkbox){
					row._tr.childElements()[0].childElements()[0].checked = true;
					this._checkbox.master.checked = true;
				}
				if(row.onSelect) row.onSelect();
			}.bind(this));
		}
		
		//unselect all rows
		if(pAct == 'unselectAll'){
			this.rows.each(function(row){
				if(!row._tr.hasClassName('selected')) return;
				//remove 'selected' className
				row._tr.removeClassName('selected');
				//checkbox
				if(this._checkbox){
					row._tr.childElements()[0].childElements()[0].checked = false;
					this._checkbox.master.checked = false;
				}
				if(row.onUnSelect) row.onUnSelect();
			}.bind(this));
		}
		
		//call function when finished
		if(pFunc) pFunc();
	}
	,
	/**
	 * sorter
	**/
	sorter: function(pKey, pOrder){
		this.rows = this.rows.sort(function(a, b){
			var result = false;
			if(a.cell[pKey].innerHTML > b.cell[pKey].innerHTML){
				result = true;
			}else{
				result = false;
			}
			if(pOrder == 'asc'){
				return result ? 1 : -1;
			}else{
				return result ? -1 : 1;
			}
		});
	}
});