export interface HealthRecord {
    id?: string
    recorded_by?: string
    date: string
    weight?: number
  
    morning_food?: number
    morning_water_given?: number
    morning_water_left?: number
  
    evening_food?: number
    evening_water_given?: number
    evening_water_left?: number
  
    purifier_water_given?: number
    purifier_water_left?: number
  
    memo?: string
    created_at?: string
    updated_at?: string
  }
  
  export interface Profile {
    id: string
    name?: string
  }