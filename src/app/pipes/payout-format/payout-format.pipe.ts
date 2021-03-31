import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'payoutFormat'
})
export class PayoutFormatPipe implements PipeTransform {

  transform(value: any, win: number): any {
    
    return win === 0 ? -value : value;
    
  }

}
