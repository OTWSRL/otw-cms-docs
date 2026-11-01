import { handbookRoute } from '@/docs/handbook-route'

const route = handbookRoute('documentation')

export default route.HandbookPage
export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.generateStaticParams
export const dynamicParams = false
