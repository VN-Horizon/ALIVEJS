export interface EventInstruction {
    type: string;
    params: number[];
    stringParams: string[];
}

export interface ConditionalReturn {
  passedEvIds: number[];
  returnValue: number;
}

export interface EventMapping {
    evId: number;
    instructions: EventInstruction[];
    returnValues: number[];
    conditionalReturns: ConditionalReturn[];
    evFunc?: string;
}

export interface ScreenplayContextState {
    blocks: EventMapping[];
    textPool: string[];
    currentBlockIndex: number;
    currentInstructionIndex: number;
    evIdToBlockIndex: Record<number, number>;
}

export interface ResolvedEventInstruction extends EventInstruction {}

export interface EventMappingsPayload {
    events: EventMapping[];
    textPool: string[];
}
