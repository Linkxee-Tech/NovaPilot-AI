import client from './client';

export const aiService = {
    async optimizeContent(content: string, tone: string = 'professional', audience: string = 'general') {
        const response = await client.post('/posts/optimize/caption', {
            caption: content,
            tone,
            target_audience: audience
        });
        return response.data;
    },

    async generateHashtags(content: string) {
        const response = await client.post('/posts/optimize/hashtags', { content });
        return response.data;
    },

    async predictEngagement(content: string, platform: string) {
        const response = await client.post('/posts/optimize/engagement', { content, platform });
        return response.data;
    },

    async getSchedulingRecommendation(content: string, platform: string) {
        const response = await client.post('/posts/optimize/schedule', { content, platform });
        return response.data;
    },

    async optimizeMultimodalContent(
        content: string,
        mediaContext: Record<string, unknown>,
        tone: string = 'professional',
        audience: string = 'general'
    ) {
        const response = await client.post('/posts/optimize/multimodal', {
            caption: content,
            tone,
            target_audience: audience,
            media_context: mediaContext
        });
        return response.data;
    },

    async runAutomation(goal: string, context?: Record<string, unknown>) {
        const response = await client.post('/automation/run', { goal, context: context ?? {} });
        return response.data;
    },

    async generateAutomationPlan(
        goal: string,
        context: Record<string, unknown> = {},
        maxSteps: number = 5,
        execute: boolean = false
    ) {
        const response = await client.post('/automation/plan', {
            goal,
            context,
            max_steps: maxSteps,
            execute
        });
        return response.data;
    },

    async getJobStatus(jobId: string) {
        const response = await client.get(`/automation/jobs/${jobId}`);
        return response.data;
    }
};
