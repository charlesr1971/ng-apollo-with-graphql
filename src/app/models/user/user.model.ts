
export class User {

    id: number;
    name: string;
    balance: number;

    constructor(obj?: any) {

        this.id = obj && obj.id || 0;
        this.name = obj && obj.name || null;
        this.balance = obj && obj.balance || 0;


    }

}
