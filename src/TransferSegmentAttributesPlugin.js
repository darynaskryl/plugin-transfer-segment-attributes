import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'TransferSegmentAttributesPlugin';

export default class TransferSegmentAttributesPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {

    flex.Actions.addListener('afterTransferTask', async (payload) => {
      console.log('***My afterTransferTaskcallback***', payload);
      const { task } = payload;
      const holdTransferStartDate = new Date();
      const holdTransferStartTime = holdTransferStartDate.getTime();
      console.log('***Hold during Warm Transfer started at: ***', holdTransferStartTime);
      const { attributes } = task;
      const { conversations } = attributes;

      let shouldUpdateAttributes = false;
      let newAttributes = {
        ...attributes,
        conversations: {
          ...conversations
        }
      }

        newAttributes.conversations.holdTransferStartTime = holdTransferStartTime;
        shouldUpdateAttributes = true;

      if (shouldUpdateAttributes) {
        await task.setAttributes(newAttributes);
        console.log ('*** Updated Hold Time start in task attributes with value***'+ newAttributes.conversations.holdTransferStartTime);
      }

    });


    flex.Actions.addListener('beforeHangupCall', async (payload) => {
      console.log('***My beforeHangupCallcallback***', payload);
      const { task } = payload;
      const holdTransferEndDate = new Date();
      const holdTransferEndTime = holdTransferEndDate.getTime();
      console.log('***Hold during Warm Transfer finished at: ***', holdTransferEndTime);
      const { attributes } = task;
      const { conversations } = attributes;

      let shouldUpdateAttributes = false;
      let newAttributes = {
        ...attributes,
        conversations: {
          ...conversations
        }
      }

        newAttributes.conversations.holdTransferEndTime = holdTransferEndTime;
        shouldUpdateAttributes = true;

      if (shouldUpdateAttributes) {
        await task.setAttributes(newAttributes);
        console.log ('*** Updated Hold Time end in task attributes with value***'+ newAttributes.conversations.holdTransferEndTime);
      }

    });

    flex.Actions.addListener('beforeCompleteTask', async (payload) => {
      console.log('***My beforeCompleteTaskcallback***', payload);
      const { task } = payload;
      const { source } = task;
      const { transfers } = source;
      console.log ('*** transfers object: ***' + transfers);

      const isTransfer = transfers && (transfers.outgoing || transfers.incoming);

      const { attributes } = task;
      const { conversations } = attributes;

      const holdTransferStart = conversations && conversations.holdTransferStartTime;
      console.log ('*** Hold time start from task attributes ***' + holdTransferStart);
      const holdTransferEndTime = conversations && conversations.holdTransferEndTime;
      console.log ('*** Hold time end from task attributes ***' + holdTransferEndTime);

      let shouldUpdateAttributes = false;
      let newAttributes = {
        ...attributes,
        conversations: {
          ...conversations
        }
      }
      
      if (isTransfer) {
        const initiatingWorker = isTransfer.workerSid;
        const workerSid = manager.workerClient.sid;
        if (initiatingWorker === workerSid) {
          newAttributes.conversations.conversation_measure_2 = Math.round(holdTransferEndTime - holdTransferStart) / 1000;
        } else {newAttributes.conversations.conversation_measure_2 = 0;}
        shouldUpdateAttributes = true;
      }

      if (shouldUpdateAttributes) {
        await task.setAttributes(newAttributes);
        console.log ('*** Updated Hold Time duration in task attributes with value***'+ newAttributes.conversations.conversation_measure_2);
      }

    });
    
          

  }
}
