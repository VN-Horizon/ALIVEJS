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
    flag1: boolean;
    evFunc?: string;
    instructions: EventInstruction[];
    conditionalReturns: ConditionalReturn[];
    returnValues: number[];
    hasChoices: boolean;
    fromEvents: number[];
}

export interface ScreenplayContextState {
    blocks: EventMapping[];
    textPool: string[];
    currentBlockIndex: number;
    currentInstructionIndex: number;
    evIdToBlockIndex: Record<number, number>;
    passedEvIds: Set<number>;
}

export interface ResolvedEventInstruction extends EventInstruction {}

export interface EventMappingsPayload {
    events: EventMapping[];
    textPool: string[];
}
