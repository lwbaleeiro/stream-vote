export function validateCreatePoll(data: any): { title: string; options: string[]; endDate: Date; correctOptionIndex: number } {
    
    if (!data) throw new Error("Data not provided.");

    if (!Array.isArray(data.options)) throw new Error("options must be of type 'Array'");
    if (data.options.length < 2) throw new Error("options must have at least 2 items.");
    if (isNaN(Date.parse(data.endDate))) throw new Error("A poll end date must be provided.");
    if (data.endDate && new Date(data.endDate) <= new Date()) throw new Error("The end date must be after the current date.");

    if (typeof data.title !== "string" || data.title.trim() == "") throw new Error("title is required and must be of type 'string'");

    if (data.correctOptionIndex === undefined || data.correctOptionIndex === null) {
        throw new Error("The correct item for the vote is required.");
    }

    if (typeof data.correctOptionIndex !== "number") {
        throw new Error("correctOptionIndex must be of type 'number'.");
    }

    return { 
        title: data.title, 
        options: data.options, 
        endDate: new Date(data.endDate),
        correctOptionIndex: data.correctOptionIndex
    };
}

export function validateVote(data: any): { pollId: string; optionIndex: number; } {

    if (!data) throw new Error("Data not provided.");

    if (typeof data.pollId !== "string" || data.pollId.trim() == "") throw new Error("pollId is required and must be of type 'string'");
    if (typeof data.optionIndex !== "number") throw new Error("optionIndex is required and must be of type 'number'");

    return { 
        pollId: data.pollId, 
        optionIndex: data.optionIndex, 
    };
}