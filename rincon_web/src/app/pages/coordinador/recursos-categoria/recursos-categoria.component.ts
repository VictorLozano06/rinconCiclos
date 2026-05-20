import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-recursos-categoria-coordinador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recursos-categoria.component.html',
  styleUrl: './recursos-categoria.component.css'
})
export class RecursosCategoriaComponent implements OnInit {
  public section: string | null = null;
  public subsection: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.section = params['section'] || null;
      this.subsection = params['subsection'] || null;
    });
  }
}
