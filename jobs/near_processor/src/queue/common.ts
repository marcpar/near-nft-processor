interface Queue {
    getNextJob: () => Promise<Job>
}

interface Job {
    payload: Payload
    complete: () => Promise<void>,
    requeue: () => Promise<void>
}

type Payload = {
    JobId: string,
    ArweaveTxId: string,
    TokenId: string,
    Title?: string,
    Description?: string,
    Copies?: number,
    IssuedAt?: string,
    ExpiresAt?: string,
    StartsAt?: string,
    UpdatedAt?: string,
    Metadata: string
}

export {
    Queue,
    Job,
    Payload
}