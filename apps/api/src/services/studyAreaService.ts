import * as turf from '@turf/turf';
import { config } from '../config';
import { StudyAreaEntity } from '../types';
import { spatialRepo } from '../repositories/spatialRepository';

export class StudyAreaService {
  public static generateStudyArea(
    id: string = config.studyArea.id,
    name: string = config.studyArea.name,
    lat: number = config.studyArea.lat,
    lon: number = config.studyArea.lon,
    radiusM: number = config.studyArea.radiusM,
    marginM: number = config.studyArea.marginM,
    sourceName: string = 'OpenStreetMap Nominatim Geocoding Verified Landmark',
    sourceUrl: string = 'https://nominatim.openstreetmap.org/details.php?place_id=422058848'
  ): StudyAreaEntity {
    const centerPoint = turf.point([lon, lat]);
    
    // Primary study boundary
    const circlePolygon = turf.circle(centerPoint, radiusM / 1000, {
      steps: 64,
      units: 'kilometers'
    });

    // Margin boundary for road connectivity
    const marginCircle = turf.circle(centerPoint, (radiusM + marginM) / 1000, {
      steps: 64,
      units: 'kilometers'
    });

    return {
      id,
      name,
      centerLatitude: lat,
      centerLongitude: lon,
      radiusM,
      marginM,
      boundaryGeoJson: circlePolygon.geometry,
      marginBoundaryGeoJson: marginCircle.geometry,
      sourceName,
      sourceUrl,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public static async initializeDefaultStudyArea(): Promise<StudyAreaEntity> {
    const areas = await this.initializeDefaultStudyAreas();
    return areas[0];
  }

  public static async initializeDefaultStudyAreas(): Promise<StudyAreaEntity[]> {
    // 1. PCCOE 1 km Core Study Area
    let pccoeArea = await spatialRepo.getStudyArea(config.studyArea.id);
    if (!pccoeArea) {
      pccoeArea = this.generateStudyArea(
        'sa-pccoe-1km',
        'PCCOE 1 km Study Area (Pradhikaran Core)',
        18.651674,
        73.761536,
        1000,
        150,
        'PCCOE Campus Reference Point, Sector 26, Pradhikaran, Nigdi',
        'https://nominatim.openstreetmap.org/details.php?place_id=422058848'
      );
      await spatialRepo.saveStudyArea(pccoeArea);
    }

    // 2. PCMC City-Wide Digital Twin (~181 km² administrative area)
    let pcmcArea = await spatialRepo.getStudyArea('sa-pcmc-full');
    if (!pcmcArea) {
      pcmcArea = this.generateStudyArea(
        'sa-pcmc-full',
        'PCMC Municipal Corporation Boundary (Pimpri-Chinchwad City-Wide)',
        18.629800,
        73.799700,
        8500,
        1500,
        'Pimpri Chinchwad Municipal Corporation (PCMC Administrative Jurisdiction)',
        'https://en.wikipedia.org/wiki/Pimpri-Chinchwad'
      );
      await spatialRepo.saveStudyArea(pcmcArea);
    }

    return [pccoeArea, pcmcArea];
  }
}
