/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope public
 */
define(['N/search','N/record'],

function(search,record) {
   
    function beforeSubmit(scriptContext) {

		var rec = scriptContext.newRecord;
        var recType = rec.getValue('type');
        log.debug('recType', recType)

        var contextType = scriptContext.type

        log.debug('contextType', contextType)

        if(recType == 'employee'){
            rec.setValue({

                fieldId: 'custentity_action',
    
                value: contextType
    
                });

        }

        if(recType == 'itemrcpt' || recType == 'purchord' || recType == 'vendbill'){
            rec.setValue({

                fieldId: 'custbody_record_action',
    
                value: contextType
    
                });

                var lineNumToUse = 0;

                var lineCount = rec.getLineCount({sublistId: 'item'});

                for ( var lineNumber = 0 ; lineNumber < lineCount ; lineNumber++){

                    lineNumToUse = lineNumToUse + 1

                    rec.setSublistValue({
        
                        sublistId: 'item',
        
                        fieldId: 'custcol_line_no',
        
                        line: lineNumber,
        
                        value: lineNumToUse
        
                        });
        
                }

                var lineCount = rec.getLineCount({sublistId: 'expense'});

                for ( var lineNumber = 0 ; lineNumber < lineCount ; lineNumber++){

                    lineNumToUse = lineNumToUse + 1
        
                    rec.setSublistValue({
        
                        sublistId: 'expense',
        
                        fieldId: 'custcol_line_no',
        
                        line: lineNumber,
        
                        value: lineNumToUse
        
                        });
                }
        }
        
		
    }

    return {
        beforeSubmit: beforeSubmit,
    };
    
});