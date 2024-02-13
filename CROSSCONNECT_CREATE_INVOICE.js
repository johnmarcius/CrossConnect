/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/search','N/record','N/format'],

function(search,record,format) {

    function postRequest(context) {
        log.debug(context.request.method)
        log.debug('parameters', context.request.parameters)
        log.debug('body', context.request.body)
        var body = JSON.parse(context.request.body)
        var msg;
        var responseObj = {
            status: '',
            message: ''
        }
        if(context.request.method == "POST"){
        
            log.debug('post trying')
            try {
                var recordType = body['recordtype']
                log.debug('recordType', recordType)

                var poIntId = body['po_internal_id']
                log.debug('poIntId', poIntId)

                var billId;

                var originalInvNum = body['original_invoice_number']
                log.debug('originalInvNum', originalInvNum)
                if(!isEmpty(originalInvNum)){
                    search.create({
                        type : search.Type.VENDOR_BILL,
                        filters : [ [ 'tranId', search.Operator.IS, originalInvNum ] ],
                        columns : [ 'internalid' ],
                    }).run().each(function(result) {
                        billId = result.id;
                    });
                    log.debug('billId', billId)
                }
                
                var vendorbillRec;
                var updateType = 'create';
                if(recordType == 'vendorbill'){
                    if(!isEmpty(poIntId)){
                        vendorbillRec = record.transform({
                            fromType: record.Type.PURCHASE_ORDER,
                            fromId: poIntId,
                            toType: record.Type.VENDOR_BILL,
                            isDynamic: true,
                        });
                        updateType = 'transform'
                    }else{
                        vendorbillRec = record.create({
                            type: recordType,
                            isDynamic: true
                        });
                    }
                }else{
                    if(!isEmpty(poIntId)){
                        var billInternalId;
                        var poSearch = search.load({
                            id: 'customsearch_billing_transaction'//you will input the id of the saved search
                        });
                        
                        poSearch.filters.push(search.createFilter({
                            name: 'internalid',
                            operator: 'anyof',
                            values: [poIntId]
                        }))
                    
                        poSearch.run().each(function(result) {
                            billInternalId = result.getValue({
                                name: 'internalid',
                                join: 'billingtransaction',
                                summary: 'GROUP'
                            })
                            
                        })
                        log.debug('billInternalId', billInternalId)
                        if(billInternalId){
                            vendorbillRec = record.transform({
                                fromType: record.Type.VENDOR_BILL,
                                fromId: billInternalId,
                                toType: record.Type.VENDOR_CREDIT,
                                isDynamic: true,
                            });
                            updateType = 'transform'
                        }else{
                            vendorbillRec = record.create({
                                type: recordType,
                                isDynamic: true
                            });
                        }
                    }else{
                        if(!isEmpty(billId)){
                            vendorbillRec = record.transform({
                                fromType: record.Type.VENDOR_BILL,
                                fromId: billId,
                                toType: record.Type.VENDOR_CREDIT,
                                isDynamic: true,
                            });
                            updateType = 'transform'
                        }else{
                            vendorbillRec = record.create({
                                type: recordType,
                                isDynamic: true
                            });
                        }
                        
                    }

                    
                }
                log.debug('updateType', updateType)
                //const keys = Object.keys(courses);
                
                for (var key in body) {
                    var itemPresentInSystem = false;
                    var globalItemId;
                    log.debug('inside',key + ' - ' + body[key]);
                    if(key != 'externalid' && key != 'item' && key != 'expense'){
                        if(key != 'recordtype' && key != 'subsidiary'){
                            var valueToPush;
                            if(key == 'createddate' || key == 'duedate'){
                                var dateString = body[key]
                                /*var dateParts = dateString.split("-");
                                var dateObject = dateParts[1] + '/' + dateParts[2] + '/' + dateParts[0]
                                var dateObject = new Date(dateParts[1], dateParts[2], dateParts[0])*/
                                var dateObject = new Date(dateString)
                                // 12.28.23 - AJS - Set trandate using createddate - Line 110-118
                                if(key == 'createddate'){
                                    log.debug('createddate', dateObject)
                                    if (body.hasOwnProperty('createddate')){
                                        vendorbillRec.setValue({
                                            fieldId: 'trandate',
                                            value: dateObject
                                        });
                                    } 
                                }
                                valueToPush = dateObject
                            }else if(key == 'id'){
                                key = 'externalid'
                                if(recordType == 'vendorbill'){
                                    valueToPush = 'Coupa-VendorBill' + body['id']
                                }else{
                                    valueToPush = 'Coupa-VendorCredit-' + body['id']
                                }
                            }
                            /*else if(key == 'memo'){
                                var memoValue = body[key]
                                
                                var itemSearch = search.load({
                                    id: 'customsearch_item_check'//you will input the id of the saved search
                                });
                                
                                itemSearch.filters.push(search.createFilter({
                                    name: 'internalid',
                                    operator: 'anyof',
                                    values: [memoValue]
                                }))
                            
                                itemSearch.run().each(function(result) {
                                    var itemInternalId = result.getValue({
                                        name: 'item'
                                    })
                                    log.debug('itemInternalId - memoValue', itemInternalId + ' ' + memoValue)
                                    if(itemInternalId == memoValue){
                                        itemPresentInSystem == true;
                                        globalItemId = itemInternalId
                                    }
                                })
                            }*/
                            else if(key == 'currency'){
                                var currencySearch = search.create({
                                    type: search.Type.CURRENCY,
                                    title: 'Currency Search',
                                    id: 'customsearch_currency_by_name',
                                    columns: [{
                                        name: 'internalid'
                                    }, {
                                        name: 'name'
                                    }, ],
                                    filters: [{
                                        name: 'name',
                                        operator: 'is',
                                        values: [body[key]]
                                    }]
                                });
                                var currencySearchResult = currencySearch.run();
                                var currencySearchRow = currencySearchResult.getRange(0,1);
                                var currencySearchRowCount = currencySearchRow.length;
                                var internalid;
                                if(currencySearchRowCount > 0){
                                    var currencyName = currencySearchRow[0].getValue({
                                        name: 'name'
                                    })
                                    if(currencyName == body[key]){
                                        log.debug('currency check', currencyName + ' = ' + body[key])
                                        internalid = currencySearchRow[0].getValue({
                                            name: 'internalid'
                                        })
                                        log.debug('currency internalid', internalid)
                                    }
                                }
                                valueToPush = internalid
                            }else if(key == 'postingperiod'){
                                var postingDate = body[key];
                                var postingDatesArray = postingDate.split('/');
                                var year = postingDatesArray[0]
                                var month = postingDatesArray[1]
                                var postToDate = month + '/01/' + year; 
                                //postToDate = new Date(postToDate); 
                                /* This was replaced by below
                                month = postToDate.toLocaleString('default', { month: 'short' });
                                month = month.substring(0,3)
                                var postingName = month + ' ' + year
                                log.debug('postingName', postingName)
                                var accountingPeriodSearch = search.create({
                                    type: search.Type.ACCOUNTING_PERIOD,
                                    title: 'Accounting Period Search',
                                    id: 'customsearch_accounting_period_s',
                                    columns: [{
                                        name: 'internalid'
                                    }, {
                                        name: 'periodname'
                                    }, ],
                                    filters: [{
                                        name: 'periodname',
                                        operator: 'is',
                                        values: [postingName]
                                    }]
                                });
                                
                                var accountingPeriodSearchResult = accountingPeriodSearch.run();
                                var accountingPeriodSearchRow = accountingPeriodSearchResult.getRange(0,1);
                                var accountingPeriodSearchRowCount = accountingPeriodSearchRow.length;
                                var internalid;
                                if(accountingPeriodSearchRowCount > 0){
                                    var periodName = accountingPeriodSearchRow[0].getValue({
                                        name: 'periodname'
                                    })
                                    if(periodName == postingName){
                                        log.debug('posting check', periodName + ' = ' + postingName)
                                        internalid = accountingPeriodSearchRow[0].getValue({
                                            name: 'internalid'
                                        })
                                        log.debug('posting internalid', internalid)
                                    }
                                }
                                */
                                // a. Search for the first open period by invoice date
                                var accountingPeriodSearch = search.create({
                                    type: search.Type.ACCOUNTING_PERIOD,
                                    title: 'Accounting Period Search',
                                    id: 'customsearch_accounting_period_s',
                                    columns: [
                                        search.createColumn({
                                            name: "internalid",
                                            sort: search.Sort.ASC
                                        }),
                                        search.createColumn({
                                            name: "periodname",
                                        })
                                    ],
                                    filters: [
                                        ['closed','is','F'],'and',
                                        ['isquarter','is','F'],'and',
                                        ['isyear','is','F'],'and',
                                        ['isinactive','is','F'],'and',
                                        ['enddate','after',postToDate]
                                    ]
                                });
                                var accountingPeriodSearchResult = accountingPeriodSearch.run().getRange(0,1);
                                log.debug('accountingPeriodSearchResult',accountingPeriodSearchResult)
                                var accountingPeriodSearchRowCount = accountingPeriodSearchResult.length;
                                var internalid;
                                
                                if(accountingPeriodSearchRowCount > 0){
                                    var periodName = accountingPeriodSearchResult[0].getValue({ name: 'periodname' });
                                    internalid = accountingPeriodSearchResult[0].getValue({ name: 'internalid' });
                                    log.debug('posting period', 'name: ' + periodName + ', Id: ' + internalid)
                                }
                                // a. End
                                valueToPush = internalid
                            }else if(key == 'account'){
                                var accountSearch = search.create({
                                    type: search.Type.ACCOUNT,
                                    title: 'Account Search',
                                    id: 'customsearch_account_by_name',
                                    columns: [{
                                        name: 'internalid'
                                    }, {
                                        name: 'number'
                                    }, ],
                                    filters: [{
                                        name: 'number',
                                        operator: 'is',
                                        values: [body[key]]
                                    }]
                                });
                                var accountSearchResult = accountSearch.run();
                                var accountSearchRow = accountSearchResult.getRange(0,1);
                                var accountSearchRowCount = accountSearchRow.length;
                                var internalid;
                                if(accountSearchRowCount > 0){
                                    var accountNumber = accountSearchRow[0].getValue({
                                        name: 'number'
                                    })
                                    if(accountNumber == body[key]){
                                        log.debug('account check', accountNumber + ' = ' + body[key])
                                        internalid = accountSearchRow[0].getValue({
                                            name: 'internalid'
                                        })
                                        log.debug('account internalid', internalid)
                                    }
                                }
                                valueToPush = internalid
                            }else if(key == 'class'){
                                key = 'custcol_coupa_project'
                            }else{
                                valueToPush = body[key]
                            }

                            
                            //valueToPush = body[key]

                            
                            
                            vendorbillRec.setValue({
                                fieldId: key,
                                value: valueToPush
                            })
                        }
                    }

                    var buyerList = vendorbillRec.getValue({
                        fieldId: 'custbodyicon_buyerlist'
                    })
                    if(isEmpty(buyerList)){
                        vendorbillRec.setValue({
                            fieldId: 'custbodyicon_buyerlist',
                            value: 3015
                        })
                    }
                    

                    /*if(key == 'item' && itemPresentInSystem){
                        if(items.length == 0 && itemPresentInSystem){
                            runExpense(body[key], 'item', globalItemId, vendorbillRec)
                        }else{
                            var items = body[key]
                            var itemValueToPush;
                            log.debug('items', items)
                            log.debug('items.length', items.length)
                            for(var i = 0; i < items.length; i++){
                                vendorbillRec.selectNewLine({
                                    sublistId: 'item'
                                });
                                vendorbillRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    value: items[i]['id']
                                });
                                for (var item in items[i]) {
                                    
                                    if(item != 'id'){
                                        if(item == 'amortizstartdate' || item == 'amortizationenddate'){
                                            log.debug('items[i][item]', items[i][item])
                                            if(items[i][item] != null){
                                                var dateString = items[i][item]
                                                var dateObject = new Date(dateString)
                                                itemValueToPush = dateObject
                                            }else{
                                                continue;
                                            }
                                        }else if(item == 'amortizationsched'){
                                            if(items[i][item] != null){
                                                var amortizationTemplateSearch = search.create({
                                                    type: 'amortizationtemplate',
                                                    title: 'Amortization Template Search',
                                                    id: 'customsearch_amort_temp',
                                                    columns: [{
                                                        name: 'internalid'
                                                    }, {
                                                        name: 'name'
                                                    }, ],
                                                    filters: [
                                                        search.createFilter({
                                                            name: 'formulatext',
                                                            formula: '{name}',
                                                            operator: 'startswith',
                                                            values: [items[i][item]]
                                                        })
                                                    ]
                                                });
                                                var amortizationTemplateSearchResult = amortizationTemplateSearch.run();
                                                var amortizationTemplateSearchRow = amortizationTemplateSearchResult.getRange(0,1);
                                                var amortizationTemplateSearchRowCount = amortizationTemplateSearchRow.length;
                                                var internalid;
                                                if(amortizationTemplateSearchRowCount > 0){
                                                    var amortName = amortizationTemplateSearchRow[0].getValue({
                                                        name: 'name'
                                                    })
                                                    if(amortName == items[i][item]){
                                                        log.debug('amort check', amortName + ' = ' + items[i][item])
                                                        internalid = amortizationTemplateSearchRow[0].getValue({
                                                            name: 'internalid'
                                                        })
                                                        log.debug('amort internalid', internalid)
                                                    }
                                                }
                                                itemValueToPush = internalid
                                            }else{
                                                continue;
                                            }
                                        }
                                        else{
                                            itemValueToPush = items[i][item]
                                        }
                                    }

                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: item,
                                        value: itemValueToPush
                                    });
                                    
                                }
                                vendorbillRec.commitLine({
                                    sublistId: 'item'
                                });
                            }
                        }
                    }*/

                    log.debug('updateType', updateType)

                    if(recordType == 'vendorcredit'){
                        if(key == 'expense'){
                            /*vendorbillRec.setValue({
                                fieldId: 'autoapply',
                                value: true
                            })*/
                            
                            var originalInvNum = body['original_invoice_number']
                            log.debug('originalInvNum', originalInvNum)
                            if(!isEmpty(originalInvNum)){
                                var billId;
                                search.create({
                                    type : search.Type.VENDOR_BILL,
                                    filters : [ [ 'tranId', search.Operator.IS, originalInvNum ] ],
                                    columns : [ 'internalid' ],
                                }).run().each(function(result) {
                                    billId = result.id;
                                });
                                log.debug('billId', billId)
                                var lineIndex = vendorbillRec.findSublistLineWithValue({
                                    sublistId : 'apply',
                                    fieldId : 'doc',
                                    value : billId
                                });
                                log.debug('lineIndex', lineIndex)
                                if (lineIndex != -1) {
                                    vendorbillRec.selectLine({
                                        sublistId : 'apply',
                                        line : lineIndex
                                    });
                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId : 'apply',
                                        fieldId : 'apply',
                                        value : true
                                    });
                                    var dueAmount = vendorbillRec.getCurrentSublistValue({
                                        sublistId : 'apply',
                                        fieldId : 'due'
                                    });
                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId : 'apply',
                                        fieldId : 'amount',
                                        value : dueAmount
                                    });
            
                                    vendorbillRec.commitLine({
                                        sublistId : 'apply'
                                    });
                                }
                            }

                            runExpense(body[key], vendorbillRec, updateType)
                        }
                    }

                    if(recordType == 'vendorbill' && updateType == 'transform'){
                        if(key == 'expense'){
                            var expenses = body[key]
                            log.debug('expenses', expenses)
                            log.debug('expenses.length', expenses.length)
                            var expenseLength = expenses.length - 1
                            var linetype = 'item';
                            var oppItemCount = vendorbillRec.getLineCount('item') - 1;
                            log.debug('item oppItemCount', oppItemCount)

                            if(oppItemCount == -1){
                                oppItemCount = vendorbillRec.getLineCount('expense') - 1;
                                linetype = 'expense'
                                log.debug('expense oppItemCount', oppItemCount)
                            }
                            var poLineNums = []
                            for(var i = 0; i <= expenseLength; i++){
                                var poLineNum;
                                for (var expense in expenses[i]) {
                                    if(expense == 'po_line_number' && !isEmpty(expenses[i][expense])){
                                        poLineNum = expenses[i][expense]
                                        poLineNums.push(Number(poLineNum))
                                    }
                                }
                            }

                            log.debug('poLineNums', poLineNums)

                            for(var x = oppItemCount; x >= 0; x--) {  // loop through all the line items
                            //Do the logic here. Remove or Update Line item.
                                log.debug('x', x)
                                vendorbillRec.selectLine({
                                    sublistId: linetype,
                                    line: x,
                                });
                                
                                var itemNum = vendorbillRec.getCurrentSublistValue({
                                    sublistId: linetype,
                                    fieldId: 'custcol_line_no'
                                });

                                itemNum = Number(itemNum);

                                log.debug('itemNum', itemNum)

                                log.debug('poLineNums.indexOf(itemNum)', poLineNums.indexOf(itemNum))
                                if(poLineNums.indexOf(itemNum) == -1){
                                    vendorbillRec.removeLine({
                                        sublistId: linetype,
                                        line: x,
                                    });
                                }
                                //oppItemCount = vendorbillRec.getLineCount('item') - 1;
                            }
                            var oppItemCount = vendorbillRec.getLineCount(linetype) - 1;
                            log.debug(linetype + ' after oppItemCount', oppItemCount)
                            for(var i = 0; i <= expenseLength; i++){
                                var sublistType;
                                var amount;
                                var quantity;
                                var itemToPass;
                                var poLineNum;
                                var memoValue;
                                var creditLocation;
                                for (var expense in expenses[i]) {
                                    if(expense == 'po_line_number'){
                                        poLineNum = expenses[i][expense]
                                    }else if(expense == 'amount'){
                                        amount = expenses[i][expense]
                                    }else if(expense == 'location' && recordType == 'vendorcredit'){
                                        creditLocation = expenses[i][expense]
                                    }else if(expense == 'quantity'){
                                        quantity = expenses[i][expense]
                                    }else if(expense == 'memo'){
                                        memoValue = expenses[i][expense]
                                        var itemSearch = search.load({
                                            id: 'customsearch_search_for_item_name'//you will input the id of the saved search
                                        });
                                        
                                        itemSearch.filters.push(search.createFilter({
                                            name: 'name',
                                            operator: 'is',
                                            values: [memoValue]
                                        }))
                                    
                                        itemSearch.run().each(function(result) {
                                            var itemInternalId = result.getValue({
                                                name: 'internalid'
                                            })
                                            var itemName = result.getValue({
                                                name: 'itemid'
                                            })
                                            
                                            if(itemName.toString() == memoValue.toString()){
                                                //if(itemInternalId == 22 || itemInternalId == 90 || itemInternalId == 89 || itemInternalId == 88){
                                                    itemToPass = itemInternalId
                                                //}
                                            }
                                        })
                                    }
                                }
                                

                                log.debug('working with line ', i)
                                log.debug('itemToPass', itemToPass)
                                log.debug('memoValue', memoValue)

                                //var rate;

                                //if(oppItemCount >= i){

                                if(!itemToPass){
                                    sublistType = 'expense'
                                }else{
                                    sublistType = 'item'
                                }

                                if(!isEmpty(poLineNum)){
                                    log.debug('a')

                                    poLineNum = Number(poLineNum)

                                    var lineNum = vendorbillRec.findSublistLineWithValue({
                                        sublistId: sublistType,
                                        fieldId: 'custcol_line_no',
                                        value: poLineNum
                                    });

                                    log.debug('lineNum', lineNum)

                                    vendorbillRec.selectLine({
                                        sublistId: sublistType,
                                        line: lineNum
                                    });

                                    var isSplitBill = vendorbillRec.getCurrentSublistValue({
                                        sublistId: sublistType,
                                        fieldId: 'custcol_split_bill'
                                    });

                                    if(!isSplitBill){
                                        var recordAmount = vendorbillRec.getCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'amount'
                                        });

                                        if(sublistType == 'item'){
                                            var recordRate = vendorbillRec.getCurrentSublistValue({
                                                sublistId: sublistType,
                                                fieldId: 'rate'
                                            });
                                            var recordQuantity = vendorbillRec.getCurrentSublistValue({
                                                sublistId: sublistType,
                                                fieldId: 'quantity'
                                            });
        
                                            log.debug('recordRate', recordRate)
                                            log.debug('recordQuantity - quantity', recordQuantity + " - " + quantity)
                                            log.debug('recordAmount - amount', recordAmount + " - " + amount)
        
                                            if(recordQuantity != quantity){
                                                vendorbillRec.setCurrentSublistValue({
                                                    sublistId: sublistType,
                                                    fieldId: 'quantity',
                                                    value: quantity
                                                });
                                            }
                                            
                                            var calculatedRate = amount / quantity
        
                                            if(recordRate != calculatedRate){
                                                vendorbillRec.setCurrentSublistValue({
                                                    sublistId: sublistType,
                                                    fieldId: 'rate',
                                                    value: calculatedRate
                                                });
                                            }
                                        }
                                        
                                        if(recordAmount != amount){
                                            vendorbillRec.setCurrentSublistValue({
                                                sublistId: sublistType,
                                                fieldId: 'amount',
                                                value: amount
                                            });
                                        }
    
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'custcol_split_bill',
                                            value: true
                                        });
                                    }else{
                                        var lineNum = vendorbillRec.selectNewLine({
                                            sublistId: sublistType
                                        });
                                        
                                        
                                        if(itemToPass){
                                            vendorbillRec.setCurrentSublistValue({
                                                sublistId: sublistType,
                                                fieldId: 'item',
                                                value: itemToPass
                                            });
                                        }

                                        
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'quantity',
                                            value: quantity
                                        });
                                        
                                        
                                        var calculatedRate = amount / quantity
    
                                        
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'rate',
                                            value: calculatedRate
                                        });
                                        
                                        
    
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'amount',
                                            value: amount
                                        });
                                        
    
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'custcol_split_bill',
                                            value: true
                                        });

                                        log.debug('new line for split bill', lineNum)
                                    }

                                    
                                    
                                }else{
                                
                                //if(oppItemCount < i){
                                    
                                    log.debug('b')
                                    var lineNum = vendorbillRec.selectNewLine({
                                        sublistId: sublistType
                                    });

                                    if(itemToPass){
                                        vendorbillRec.setCurrentSublistValue({
                                            sublistId: sublistType,
                                            fieldId: 'item',
                                            value: itemToPass
                                        });
                                    }

                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId: sublistType,
                                        fieldId: 'account',
                                        value: accountLine
                                    });

                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId: sublistType,
                                        fieldId: 'quantity',
                                        value: quantity
                                    });
    
                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId: sublistType,
                                        fieldId: 'amount',
                                        value: amount
                                    });

                                    

                                    log.debug('done b')
                                }

                                

                                
                                
                                

                                vendorbillRec.commitLine({
                                    sublistId: sublistType
                                });
                                log.debug('done commit')
                            }
                        }
                    }
                    
                    if(recordType == 'vendorbill' && updateType == 'create'){
                        if(key == 'expense'){
                            runExpense(body[key], vendorbillRec)
                        }
                    }
                    
                    
                }

                log.debug('try to save')
                var buyersList = vendorbillRec.getValue({
                    fieldId: 'custbodyicon_buyerlist'
                })

                log.debug('buyersList', buyersList)
                var vendorbillId = vendorbillRec.save()
                

                log.debug('vendorbillId', vendorbillId)
                msg = vendorbillId;
                responseObj.message = 'Vendor Bill created - Internal Id: ' + msg
                responseObj.status = 'success'
            } catch (error) {
                msg = error.message;
                responseObj.message = msg;
                responseObj.status = 'error'
                log.error('error', msg)
            }
            
        }

        context.response.write({
            output: JSON.stringify(responseObj)
        });
        //context.response.writePage(msg);

    }

    function runExpense(bodyval, vendorbillRec, updateType){
        var expenses = bodyval
        var memoValue;
        var globalItemId;
        var itemPresentInSystem = false;
        var lineType;

        
                        var expenseValueToPush;
                        log.debug('expenses', expenses)
                        log.debug('expenses.length', expenses.length)
                        for(var i = 0; i < expenses.length; i++){
                            

                            memoValue = expenses[i]['memo']
                            if(!isEmpty()){
                                var itemSearch = search.load({
                                    id: 'customsearch_search_for_item_name'//you will input the id of the saved search
                                });
                                
                                itemSearch.filters.push(search.createFilter({
                                    name: 'name',
                                    operator: 'is',
                                    values: [memoValue]
                                }))
                            
                                itemSearch.run().each(function(result) {
                                    var itemInternalId = result.getValue({
                                        name: 'internalid'
                                    })
                                    var itemName = result.getValue({
                                        name: 'itemid'
                                    })
                                    log.debug('itemName - memoValue', itemName + ' ' + memoValue)
                                    if(itemName.toString() == memoValue.toString()){
                                        itemPresentInSystem = true;
                                        globalItemId = itemInternalId
                                    }
                                })
    
                                log.debug('itemPresentInSystem', itemPresentInSystem)
                                log.debug('globalItemId', globalItemId)
                            }
                            

                            if(itemPresentInSystem){
                                lineType = 'item'
                            }else{
                                lineType = 'expense'
                            }

                            if(updateType == 'transform'){
                                vendorbillRec.selectLine({
                                    sublistId: lineType,
                                    line: i
                                });
                                
                            }else{
                                vendorbillRec.selectNewLine({
                                    sublistId: lineType
                                });
                            }
                            

                            for (var expense in expenses[i]) {
                                if(expense == 'account'){
                                    if(lineType == 'expense'){
                                        var accountSearch = search.create({
                                            type: search.Type.ACCOUNT,
                                            title: 'Account Search',
                                            id: 'customsearch_account_by_name',
                                            columns: [{
                                                name: 'internalid'
                                            }, {
                                                name: 'number'
                                            }, ],
                                            filters: [{
                                                name: 'number',
                                                operator: 'is',
                                                values: [expenses[i][expense]]
                                            }]
                                        });
                                        var accountSearchResult = accountSearch.run();
                                        var accountSearchRow = accountSearchResult.getRange(0,1);
                                        var accountSearchRowCount = accountSearchRow.length;
                                        var internalid;
                                        if(accountSearchRowCount > 0){
                                            var accountNumber = accountSearchRow[0].getValue({
                                                name: 'number'
                                            })
                                            if(accountNumber == expenses[i][expense]){
                                                log.debug('account check', accountNumber + ' = ' + expenses[i][expense])
                                                internalid = accountSearchRow[0].getValue({
                                                    name: 'internalid'
                                                })
                                                log.debug('account internalid', internalid)
                                            }
                                        }
                                        expenseValueToPush = internalid
                                    }else{
                                        expense = 'item'
                                        expenseValueToPush = globalItemId
                                    }
                                }else if(expense == 'project'){
                                    expense = 'custcol_cseg_sik_project'
                                    expenseValueToPush = expenses[i]['project']
                                }else if(expense == 'amortizstartdate' || expense == 'amortizationenddate'){
                                    log.debug('expenses[i][expense]', expenses[i][expense])
                                    if(expenses[i][expense] != null){
                                        var dateString = expenses[i][expense]
                                        var dateObject = new Date(dateString)
                                        expenseValueToPush = dateObject
                                    }else{
                                        continue;
                                    }
                                }else if(expense == 'quantity'){
                                    log.debug('expenses[i][expense]', expenses[i][expense])
                                    var quantity = expenses[i][expense]
                                    expenseValueToPush = quantity
                                    //expenseValueToPush = quantity.replace('-','')
                                    
                                }else if(expense == 'amortizationsched'){
                                    if(expenses[i][expense] != null){
                                        var amortizationTemplateSearch = search.create({
                                            type: 'amortizationtemplate',
                                            title: 'Amortization Template Search',
                                            id: 'customsearch_amort_temp',
                                            columns: [{
                                                name: 'internalid'
                                            }, {
                                                name: 'name'
                                            }, ],
                                            filters: [
                                                search.createFilter({
                                                    name: 'formulatext',
                                                    formula: '{name}',
                                                    operator: 'startswith',
                                                    values: [expenses[i][expense]]
                                                })
                                            ]
                                        });
                                        var amortizationTemplateSearchResult = amortizationTemplateSearch.run();
                                        var amortizationTemplateSearchRow = amortizationTemplateSearchResult.getRange(0,1);
                                        var amortizationTemplateSearchRowCount = amortizationTemplateSearchRow.length;
                                        var internalid;
                                        if(amortizationTemplateSearchRowCount > 0){
                                            var amortName = amortizationTemplateSearchRow[0].getValue({
                                                name: 'name'
                                            })
                                            if(amortName == expenses[i][expense]){
                                                log.debug('amort check', amortName + ' = ' + expenses[i][expense])
                                                internalid = amortizationTemplateSearchRow[0].getValue({
                                                    name: 'internalid'
                                                })
                                                log.debug('amort internalid', internalid)
                                            }
                                        }
                                        expenseValueToPush = internalid
                                    }else{
                                        continue;
                                    }
                                }else if(expense == 'class'){
                                    expense = 'custcol_coupa_project'
                                    expenseValueToPush = expenses[i]['class']
                                }else{
                                    expenseValueToPush = expenses[i][expense]
                                }
                                log.debug('lineType - expense + expenseValueToPush', lineType + ' ' + expense + ' ' + expenseValueToPush)
                                if(updateType != 'transform'){
                                    vendorbillRec.setCurrentSublistValue({
                                        sublistId: lineType,
                                        fieldId: expense,
                                        value: expenseValueToPush
                                    });
                                }
                                
                            }
                            vendorbillRec.commitLine({
                                sublistId: lineType
                            }); 

                            log.debug('line comitted')
                            itemPresentInSystem = false;
                            globalItemId = 0;
                        }
    }

    function getMonthName(monthNumber) {
        const date = new Date();
        date.setMonth(monthNumber - 1);
      
        return date.toLocaleString('en-US', {
          month: 'short',
        });
      }

      function isEmpty(object) {
        if (object === null || object === undefined || object === '' || object === ' ')
            return true;
        return false;
    }

    return {
        onRequest: postRequest,
    };
    
});