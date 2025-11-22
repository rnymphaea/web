import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { DataService, Settings } from '../data/data.service';
import { SimulationGateway } from './simulation.gateway';

@Controller('simulation')
export class SimulationController {
  constructor(
    private readonly dataService: DataService,
    private readonly simulationGateway: SimulationGateway,
  ) {}

  @Get('settings')
  getSettings(): Settings {
    return this.dataService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() settings: Partial<Settings>): Settings {
    const currentSettings = this.dataService.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    this.dataService.saveSettings(updatedSettings);
    return updatedSettings;
  }

  @Post('start')
  startSimulation(): { success: boolean } {
    const settings = this.dataService.getSettings();
    settings.isRunning = true;
    this.dataService.saveSettings(settings);
    this.simulationGateway.startSimulation();
    return { success: true };
  }

  @Post('stop')
  stopSimulation(): { success: boolean } {
    const settings = this.dataService.getSettings();
    settings.isRunning = false;
    this.dataService.saveSettings(settings);
    this.simulationGateway.stopSimulation();
    return { success: true };
  }
}
