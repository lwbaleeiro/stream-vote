export function validateCreatePoll(data: any): { title: string; options: string[]; endDate: Date; correctOptionIndex?: number } {
    
    if (!data) throw new Error("Dados não fornecidos.");

    if (!Array.isArray(data.options)) throw new Error("options deve ser do tipo 'Array'");
    if (data.options.length < 2) throw new Error("data.options tem que ter 2 itens.");
    if (isNaN(Date.parse(data.endDate))) throw new Error("Deve ser passado uma data de encerramento da votação.");

    if (typeof data.title !== "string" || data.title.trim() == "") throw new Error("title é obrigatório e deve ser do tipo 'string'");

    return { 
        title: data.title, 
        options: data.options, 
        endDate: new Date(data.endDate),
        correctOptionIndex: data.correctOptionIndex
    };
}

export function validateVote(data: any): { pollId: string; optionIndex: number; } {

    if (!data) throw new Error("Dados não fornecidos.");

    if (typeof data.pollId !== "string" || data.pollId.trim() == "") throw new Error("pollId é obrigatório e deve ser do tipo 'string'");
    if (typeof data.optionIndex !== "number") throw new Error("optionIndex é obrigatório e deve ser do tipo 'number'");
    return { 
        pollId: data.pollId, 
        optionIndex: data.optionIndex, 
    };
}