import { handbookRoute } from '@/docs/handbook-route'

const route = handbookRoute('plugins')

export default route.HandbookPage
export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.generateStaticParams
export const dynamicParams = false
