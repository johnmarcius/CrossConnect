/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/search','N/record'],

function(search,record) {
   
    function OnRequest(context) {
        log.debug(context.request.method)
        var msg;
        if(context.request.method == "POST"){
            log.debug('Post trying')
            try {
                var recordtype = context.request.parameters.custscript_record_type;
                var internalid = context.request.parameters.custscript_record_internalid;
                recordtype = recordtype.toString()
                log.debug('recordtype', recordtype)
                internalid = Number(internalid)
                log.debug('internalid', internalid)

                var objRecord = record.load({
                    type: recordtype,
                    id: internalid,
                    isDynamic: true,
                });

               if(recordtype == 'itemreceipt' || recordtype == 'purchaseorder' || recordtype == 'vendorbill'){
                    objRecord.setValue('custbody_exported', true)
               }

                if(recordtype == 'employee'){
                    objRecord.setValue('custentity_exported', true)
               }
                
                
                var recordSaved = objRecord.save()
                log.debug('recordSaved', recordSaved)
                msg = 'Record successfully exported: ' + recordSaved;
            } catch (error) {
                log.error('error', error)
                msg = error;
            }
        }
        

        context.response.writePage(msg)

    }

    return {
        onRequest: OnRequest,
    };
    
});