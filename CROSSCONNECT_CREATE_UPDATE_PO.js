    /**
     * @NApiVersion 2.x
     * @NScriptType Suitelet
     * @NModuleScope Public
     */
    define(['N/search','N/record'],

    function(search,record) {

        function postRequest(context) {
            log.debug(context.request.method)
            log.debug('parameters', context.request.parameters)
            log.debug('body', context.request.body)
            var body = JSON.parse(context.request.body)
            var msg;
            var updateType;
            var statusType;
            var responseObj = {
                status: '',
                message: ''
            }
            if(context.request.method == "POST"){
            
                log.debug('post trying')
                try {
                    var recordType = 'purchaseorder'
                    var tranIdToUse;
                    var poCoupaId = body['custbody_coupa_po_id']
                    log.debug('poCoupaId', poCoupaId)

                    var poIntId;
                    var poSearch = search.load({
                        id: 'customsearch_check_if_po_exist'//you will input the id of the saved search
                    });
                            
                    poSearch.filters.push(search.createFilter({
                        name: 'custbody_coupa_po_id',
                        operator: 'is',
                        values: [poCoupaId]
                    }))
                        
                    poSearch.run().each(function(result) {
                        poIntId = result.getValue({
                            name: 'internalid',
                        })
                    })
                    log.debug('poIntId', poIntId)

                    var poRec;
                    updateType = 'create';
                    
                    if(isEmpty(poIntId)){
                        poRec = record.create({
                            type: recordType,
                            isDynamic: true
                        });
                        statusType = 'Created'
                    }else{
                        poRec = record.load({
                            type: record.Type.PURCHASE_ORDER,
                            id: poIntId,
                            isDynamic: true,
                        });

                        var allCoupaPoLineIds = []
                        for (var key in body) {
                            if(key == 'item' || key == 'expense'){
                                var value = body[key]
                                if(!isEmpty(value)){
                                    for(var i = 0; i < value.length; i++){
                                        for (var line in value[i]) {
                                            if(line == 'custcol_coupa_po_line_id'){
                                                allCoupaPoLineIds.push(Number(value[i][line]))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        log.debug('allCoupaPoLineIds', allCoupaPoLineIds)

                        var oppItemCount = poRec.getLineCount('item') - 1;
                        for(var x = oppItemCount; x >= 0; x--) {  // loop through all the line items
                            //Do the logic here. Remove or Update Line item.
                                log.debug('x', x)
                                poRec.selectLine({
                                    sublistId: 'item',
                                    line: x,
                                });
                                
                                var poItemLineId = poRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_coupa_po_line_id'
                                });

                                poItemLineId = Number(poItemLineId);

                                log.debug('poItemLineId', poItemLineId)

                                log.debug('allCoupaPoLineIds.indexOf(poItemLineId)', allCoupaPoLineIds.indexOf(poItemLineId))
                                if(allCoupaPoLineIds.indexOf(poItemLineId) == -1){
                                    poRec.removeLine({
                                        sublistId: 'item',
                                        line: x,
                                    });
                                }
                                //oppItemCount = poRec.getLineCount('item') - 1;
                            }

                        var oppExpenseCount = poRec.getLineCount('expense') - 1;
                        for(var x = oppExpenseCount; x >= 0; x--) {  // loop through all the line items
                            //Do the logic here. Remove or Update Line item.
                            log.debug('x', x)
                            poRec.selectLine({
                                sublistId: 'expense',
                                line: x,
                            });

                            poRec.removeLine({
                                sublistId: 'expense',
                                line: x,
                            });
                                    
                            //oppItemCount = poRec.getLineCount('item') - 1;
                        }

                        updateType = 'update'
                        statusType = 'Updated'
                    }

                    

                    //const keys = Object.keys(courses);
                    
                    for (var key in body) {
                        var itemPresentInSystem = false;
                        var globalItemId;
                        log.debug('inside',key + ' - ' + body[key]);
                        if(key != 'externalid' && key != 'item' && key != 'expense'){
                            if(key != 'recordtype' && key != 'subsidiary'){
                                var valueToPush;
                                if(key == 'custbody_approval_1' ||
                                   key == 'custbody_approval_2' ||
                                   key == 'custbody_approval_3' ||
                                   key == 'custbody_approval_4' ||
                                   key == 'custbody_approval_5' ||
                                   key == 'custbody_approval_6' ||
                                   key == 'custbody_approval_7' ||
                                   key == 'custbody_approval_8' ||
                                   key == 'custbody_approval_9' ||
                                   key == 'custbody_approval_10'||
                                   key == 'custbody_finance_approval_date' ||
                                   key == 'custbody_supply_chain_review_date'){
                                    if(!isEmpty(body[key])){
                                        valueToPush = new Date(body[key])
                                    }else{
                                        valueToPush = null
                                    }
                                    poRec.setValue({
                                        fieldId: key,
                                        value: valueToPush
                                    })
                                }else if(key == 'custbody_approver_1' ||
                                    key == 'custbody_approver_2' ||
                                    key == 'custbody_approver_3' ||
                                    key == 'custbody_approver_4' ||
                                    key == 'custbody_approver_5' ||
                                    key == 'custbody_approver_6' ||
                                    key == 'custbody_approver_7' ||
                                    key == 'custbody_approver_8' ||
                                    key == 'custbody_approver_9' ||
                                    key == 'custbody_approver_10'){
                                    if(isEmpty(body[key])){
                                        valueToPush = null
                                    }else{
                                        valueToPush = body[key]
                                    }
                                    poRec.setValue({
                                        fieldId: key,
                                        value: valueToPush
                                    })
                                }else if(key == 'terms'){
                                    var termSearch = search.load({
                                        id: 'customsearch_terms_search'//you will input the id of the saved search
                                       });
                                       
                                       termSearch.filters.push(search.createFilter({
                                        name: 'name',
                                        operator: 'is',
                                        values: [body[key]]
                                       }))
                          
                                       termSearch.run().each(function(result) {
                                        var termInternalId = result.getValue({
                                          name: 'internalid'
                                        })
                                        var name = result.getValue({
                                          name: 'name'
                                        })
                                        
                                        
                                            if(name == body[key]){
                                                log.debug('name = body[key]',name + ' = ' + body[key])
                                                log.debug('termInternalId',termInternalId)
                                                valueToPush = termInternalId
                                            }
                                        
                                       })
                                    poRec.setValue({
                                        fieldId: key,
                                        value: valueToPush
                                    })
                                }else if(key == 'cseg_program'){
                                    var programId;
                                    if(!isEmpty(body[key])){
                                        var programSearch = search.create({
                                            type: 'customrecord_cseg_program',
                                            title: 'Program Search',
                                            id: 'customsearch_Program_by_name',
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
                                        var programSearchResult = programSearch.run();
                                        var programSearchRow = programSearchResult.getRange(0,1);
                                        log.debug('programSearchRow', programSearchRow)
                                        var programSearchRowCount = programSearchRow.length;
                                        log.debug('programSearchRowCount', programSearchRowCount)
                                        if(programSearchRowCount > 0){
                                            var programNumber = programSearchRow[0].getValue({
                                                name: 'number'
                                            })
                                            if(programNumber == body[key]){
                                                log.debug('program check', programNumber + ' = ' + body[key])
                                                programId = programSearchRow[0].getValue({
                                                    name: 'internalid'
                                                })
                                                log.debug('program internalid', programId)
                                                poRec.setValue({
                                                    fieldId: key,
                                                    value: programId
                                                })
                                            }
                                        }
                                    }
                                }else if(key == 'tranid'){
                                    tranIdToUse = body[key]
                                    valueToPush = body[key]
                                    if(!isEmpty(valueToPush)){
                                        poRec.setValue({
                                            fieldId: key,
                                            value: valueToPush
                                        })
                                    }
                                }
                                else{
                                    valueToPush = body[key]
                                    if(!isEmpty(valueToPush)){
                                        poRec.setValue({
                                            fieldId: key,
                                            value: valueToPush
                                        })
                                    }
                                }
                                
                                
                                
                                    
                                
                            }
                        }
                        
                        log.debug('updateType', updateType)

                        if(key == 'item' || key == 'expense'){
                            //if(updateType != 'transform'){
                                runExpense(body[key], poRec, updateType)
                            //}
                        }
                        
                    }
                    

                    poRec.setValue({
                        fieldId: 'approvalstatus',
                        value: 2
                    })
                    var approvalStatus = poRec.getText({
                        fieldId: 'approvalstatus'
                    })
                    
                    var poId = poRec.save()

                    var objRecord = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: poId,
                        isDynamic: true,
                    });

                    var tranidused = objRecord.getValue({
                        fieldId: 'tranid',
                    })

                    if(tranidused != tranIdToUse){
                        objRecord.setValue({
                            fieldId: 'tranid',
                            value: tranIdToUse
                        })
                        var poId = objRecord.save()
                    }
                    
                   
                    

                    log.debug('poId', poId)
                    msg = poId;
                    
                    responseObj.message = 'Purchase Order ' + statusType + ' - Internal Id: ' + msg + ' and is currently ' + approvalStatus + '.'

                    //Approval Status

                    responseObj.status = 'success'
                } catch (error) {
                    msg = error.message;
                    responseObj.message = msg;
                    responseObj.status = 'error'
                    log.error('error', error)
                }
                
            }

            context.response.write({
                output: JSON.stringify(responseObj)
            });
            //context.response.writePage(msg);

        }

        function runExpense(bodyval, poRec, updateType){
            var expenses = bodyval
            var memoValue;
            var globalItemId;
            var itemPresentInSystem = false;
            var lineType;
            var lineObj = {};

            

            

            
                            var expenseValueToPush;
                            log.debug('expenses', expenses)
                            log.debug('expenses.length', expenses.length)
                            for(var i = 0; i < expenses.length; i++){
                                var coupaLineId;
                                var lineNumber;

                                

                                for (var expense in expenses[i]) {
                                    
                                    expenseValueToPush = expenses[i][expense]
                                    lineObj[expense] = expenseValueToPush
                                    log.debug('expense + expenseValueToPush', expense + ' ' + expenseValueToPush)
                                }

                                log.debug('lineObj', lineObj)

                                var accountVal = lineObj['account']
                                var itemIdVal = lineObj['item_id']

                                log.debug('accountVal', accountVal)
                                log.debug('itemIdVal', itemIdVal)

                                if(isEmpty(itemIdVal)){
                                    lineType = 'expense'
                                }else{
                                    lineType = 'item'
                                }

                                if(updateType == 'create'){
                                    poRec.selectNewLine({
                                        sublistId: lineType
                                    });
                                }else{
                                    coupaLineId = lineObj['custcol_coupa_po_line_id']
                                    log.debug('coupaLineId', coupaLineId)
                                    if(!isEmpty(coupaLineId)){
                                        lineNumber = poRec.findSublistLineWithValue({
                                            sublistId: lineType,
                                            fieldId: 'custcol_coupa_po_line_id',
                                            value: coupaLineId
                                        });
                                        log.debug('lineNumber', lineNumber)
                                        if(lineNumber >= 0){
                                            poRec.selectLine({
                                                sublistId: lineType,
                                                line: lineNumber
                                            });
                                        }else{
                                            poRec.selectNewLine({
                                                sublistId: lineType
                                            });
                                        }
                                    }
                                    
                                }

                                log.debug('lineType', lineType)

                                if(lineType == 'item'){
                                    poRec.setCurrentSublistValue({
                                        sublistId: lineType,
                                        fieldId: 'item',
                                        value: itemIdVal
                                    });

                                    poRec.setCurrentSublistValue({
                                        sublistId: lineType,
                                        fieldId: 'account',
                                        value: accountVal
                                    });

                                }else{
                                    var accountId;
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
                                            values: [lineObj['account']]
                                        }]
                                    });
                                    var accountSearchResult = accountSearch.run();
                                    var accountSearchRow = accountSearchResult.getRange(0,1);
                                    log.debug('accountSearchRow', accountSearchRow)
                                    var accountSearchRowCount = accountSearchRow.length;
                                    log.debug('accountSearchRowCount', accountSearchRowCount)
                                    if(accountSearchRowCount > 0){
                                        var accountNumber = accountSearchRow[0].getValue({
                                            name: 'number'
                                        })
                                        if(accountNumber == lineObj['account']){
                                            log.debug('account check', accountNumber + ' = ' + lineObj['account'])
                                            accountId = accountSearchRow[0].getValue({
                                                name: 'internalid'
                                            })
                                            log.debug('account internalid', accountId)
                                            poRec.setCurrentSublistValue({
                                                sublistId: lineType,
                                                fieldId: 'account',
                                                value: accountId
                                            });
                                        }
                                    }
                                    
                                }

                                for (var line in lineObj) {
                                    log.debug('line + lineObj[line]', line + ' ' + lineObj[line])
                                    var valueToPush = lineObj[line]
                                    var field = line
                                    if(line == 'units'){
                                        var unitInternalId;
                                        var unitsSearch = search.load({
                                            id: 'customsearch_units_search'//you will input the id of the saved search
                                           });
                                           
                                           unitsSearch.filters.push(search.createFilter({
                                            name: 'abbreviation',
                                            operator: 'is',
                                            values: [lineObj[line]]
                                           }))
                              
                                           unitsSearch.run().each(function(result) {
                                            var unitInternalId = result.getValue({
                                              name: 'internalid'
                                            })
                                            var abbreviation = result.getValue({
                                              name: 'abbreviation'
                                            })
                                            
                                            
                                                if(abbreviation == lineObj[line]){
                                                    log.debug('abbreviation = lineobj',abbreviation + ' = ' + lineObj[line])
                                                    log.debug('unitInternalId',unitInternalId)
                                                    valueToPush = unitInternalId
                                                }
                                            
                                           })
                                           
                                    }
                                    
                                    if(line != 'account' && line != 'item_id'){
                                        poRec.setCurrentSublistValue({
                                            sublistId: lineType,
                                            fieldId: field,
                                            value: valueToPush
                                        });
                                    }
                                    
                                    
                                }

                                poRec.commitLine({
                                    sublistId: lineType
                                });
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