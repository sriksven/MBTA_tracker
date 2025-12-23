import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MBTAService } from '../services/mbta.service'

// Mock fetch globally
global.fetch = vi.fn()

describe('MBTAService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getRoutes', () => {
        it('should fetch and transform routes correctly', async () => {
            const mockResponse = {
                data: [
                    {
                        id: 'Red',
                        attributes: {
                            long_name: 'Red Line',
                            short_name: 'RL',
                            type: 1,
                            color: '#DA291C'
                        }
                    }
                ]
            }

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            })

            const routes = await MBTAService.getRoutes()

            expect(routes).toHaveLength(1)
            expect(routes[0]).toEqual({
                id: 'Red',
                name: 'Red Line',
                shortName: 'RL',
                type: 1,
                color: '#da291c'
            })
        })

        it('should return empty array on error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('API Error'))

            const routes = await MBTAService.getRoutes()

            expect(routes).toEqual([])
        })
    })

    describe('getVehicles', () => {
        it('should return empty array when no routes provided', async () => {
            const vehicles = await MBTAService.getVehicles([])
            expect(vehicles).toEqual([])
        })

        it('should fetch and transform vehicles correctly', async () => {
            const mockResponse = {
                data: [
                    {
                        id: 'vehicle-1',
                        attributes: {
                            latitude: 42.3601,
                            longitude: -71.0589,
                            bearing: 90,
                            speed: 10,
                            current_status: 'IN_TRANSIT_TO'
                        },
                        relationships: {
                            route: { data: { id: 'Red' } }
                        }
                    }
                ],
                included: [
                    {
                        type: 'route',
                        id: 'Red',
                        attributes: {
                            long_name: 'Red Line',
                            color: '#DA291C'
                        }
                    }
                ]
            }

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            })

            const vehicles = await MBTAService.getVehicles(['Red'])

            expect(vehicles).toHaveLength(1)
            expect(vehicles[0]).toMatchObject({
                id: 'vehicle-1',
                latitude: 42.3601,
                longitude: -71.0589,
                bearing: 90
            })
        })
    })

    describe('getAlerts', () => {
        it('should fetch and transform alerts correctly', async () => {
            const mockResponse = {
                data: [
                    {
                        id: 'alert-1',
                        attributes: {
                            header: 'Service Alert',
                            short_header: 'Delays on Red Line',
                            severity: 'MODERATE',
                            effect: 'DELAY'
                        }
                    }
                ]
            }

            global.fetch.mockResolvedValueOnce({
                json: async () => mockResponse
            })

            const alerts = await MBTAService.getAlerts()

            expect(alerts).toHaveLength(1)
            expect(alerts[0]).toEqual({
                id: 'alert-1',
                header: 'Service Alert',
                description: 'Delays on Red Line',
                severity: 'MODERATE',
                effect: 'DELAY'
            })
        })
    })
})
