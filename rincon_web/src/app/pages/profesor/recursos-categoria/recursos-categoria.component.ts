import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-recursos-categoria-profesor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recursos-categoria.component.html',
  styleUrl: './recursos-categoria.component.css'
})
export class RecursosCategoriaComponent implements OnInit {
  private route = inject(ActivatedRoute);

  public section: string | null = null;
  public subsection: string | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.section = params['section'] || null;
      this.subsection = params['subsection'] || null;
    });
  }
}
