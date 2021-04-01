import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'payoutFormat'
})
export class PayoutFormatPipe implements PipeTransform {

  transform(value: number, win: number): any {

    const v = value.toString().replace(/,/g, "");;
    
    return win === 0 ? -v : v;
    
  }

}
