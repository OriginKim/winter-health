export interface HealthRecord {
  id?: string
  recorded_by?: string | null
  date: string
  weight?: number | null

  morning_food?: number | null
  morning_water_given?: number | null
  morning_water_left?: number | null

  evening_food?: number | null
  evening_water_given?: number | null
  evening_water_left?: number | null

  purifier_water_given?: number | null
  purifier_water_left?: number | null

  memo?: string | null
  created_at?: string
  updated_at?: string
}

export interface Profile {
  id: string
  name?: string
}