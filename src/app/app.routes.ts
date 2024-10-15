import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { SimulationComponent } from './simulation/simulation.component';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
    {
        path: '',
        component: LandingComponent
    },
    {
        path: 'simulation',
        component: SimulationComponent
    }
];
