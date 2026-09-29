import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({ selector: '[appResaltar]' })
export class ResaltarDirective {
  @Input() colorResaltado: string = 'rgba(229, 9, 20, 0.4)';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') alEntrar() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-6px)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 12px 24px ' + this.colorResaltado);
  }

  @HostListener('mouseleave') alSalir() {
    this.renderer.removeStyle(this.el.nativeElement, 'transform');
    this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
  }
}