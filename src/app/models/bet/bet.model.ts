
export class Bet {

    id: number;
    userId: number;
    betAmount: number;
    chance: number;
    payout: number;
    win: number;

    constructor(obj?: any) {

        this.id = obj && obj.id || 0;
        this.userId = obj && obj.userId || null;
        this.betAmount = obj && obj.betAmount || 0;
        this.chance = obj && obj.chance || 0;
        this.payout = obj && obj.payout || 0;
        this.win = obj && obj.win || 0;


    }

}
