
export const collapsibleBlock: any = {
    name: 'collapsibleBlock',
    level: 'block', // Block level extension
    start(src:any) {
    // Look for the start pattern
    return src.match(/^\[collapse: /m)?.index;
    },
    tokenizer(src:any, tokens:any) {
    // Regex to capture: [collapse: HEADER] \n CONTENT \n [/collapse]
    // The 's' flag is crucial for '.' to match newlines
    // The 'm' flag is crucial for '^' to match start of line
    const rule = /^\[collapse: (.+?)\]([\s\S]*?)\[\/collapse\]/m;
    const match = rule.exec(src);
    
    if (match) {
        const token = {
        type: 'collapsibleBlock',
        raw: match[0],
        header: match[1].trim(),
        text: match[2].trim(), // The content between the tags
        tokens: [], 
        };          
        // **Crucial Fix:** Use the lexer to tokenize the content (match[2]) 
        // as block-level Markdown. This generates tokens for paragraphs, lists, etc.
        (this as any).lexer.blockTokens(token.text, token.tokens); 
        
        return token;
    }
    return undefined;
    },
    renderer(token:any) {
    // 2. Define the custom block renderer
    const contentHtml = (this as any).parser.parse(token.tokens).trim();
    
    return `
        <details class="option markdown-collapse-block">
        <summary class="option markdown-collapse-summary">${token.header}</summary>
        <div class="option markdown-collapse-content">
            ${contentHtml}
        </div>
        </details>
    `;
    }
};
/**
 * @media[A simple placeholder image](https://placehold.co/400x200){type:image}
 * @media[Product Demo Clip](https://example.com/videos/demo.mp4){type:video}
 * @media[Background Music Track](https://example.com/audio/bgsound.mp3){type:audio}
 * @media[Background Music Track](https://example.com/pdf/){type:any}
 * @media[My Resizable Image](https://placehold.co/400x200){type:image, width:300px, height:150px}
 * @media[Another Image, Default Size](https://placehold.co/600x300){type:image}
 * @media[Resizable Video Demo](https://www.w3schools.com/html/mov_bbb.mp4){type:video, width:640px, height:360px}
 * @media[Audio Track](https://www.w3schools.com/html/horse.mp3){type:audio, width:100%}
 */
export const mediaEmbedExtension = {
    name: 'mediaEmbedExtension',
    level: 'inline',

    start(src:any) {
        return src.indexOf('@media[')
    },

    tokenizer(src:any, tokens:any) {
        // Regex Explanation:
        // @media\[([^\]]+)\]                     -> @media[1: Title/Alt Text]
        // \(([^)]+)\)                           -> (2: URL)
        // \{type:(image|video|audio)            -> {type:3: mediaType
        // (?:,\s*width:(\d+(?:px|%)?))?          -> (Optional: 4: width value, e.g., 500px, 100%)
        // (?:,\s*height:(\d+(?:px|%)?))?         -> (Optional: 5: height value, e.g., 300px, 50%)
        // \}                                     -> closing brace
        const rule = /^@media\[([^\]]+)\]\(([^)]+)\)\{type:(image|video|audio|iframe|file|any)(?:,\s*width:(\d+(?:px|%)?))?(?:,\s*height:(\d+(?:px|%)?))?\}/;
        const match = rule.exec(src);
 
        if (match) {
            const token = {
                type: 'mediaEmbedExtension',
                raw: match[0],
                title: match[1],
                url: match[2],
                mediaType: match[3],
                width: match[4] || null,  // Capture width, if provided
                height: match[5] || null  // Capture height, if provided
            };
            return token;
        }
        return undefined;
    },

    renderer(token:any) {
        let { mediaType, url, title, width, height } = token;
        let output = '';

        // Build style attribute for the wrapper (initial size)
        let styleAttr = '';
        if (width || height) {
            if (width) styleAttr += `width:${width};`;
            if (height) styleAttr += `height:${height};`;
        }
        const refRule = /#Ref:([^\)]+)/;
        const match = refRule.exec(url);
        if(match){
            title = match[0];
            const suffixes = ['', '_URL','_IMG','_FILE_URL_LINK','_IFRAME'];
            for(let suffix of suffixes){
                let ele = document.getElementById(match[1]+suffix);
                if(ele){
                    url = ele.getAttribute('src');
                    if(suffix == '_IMG'){
                        mediaType='image';
                    }
                    if(!url){
                        url = ele.getAttribute('href');
                    }
                    break;
                }   
            }           
        }

        let mediaHtml = '';

        switch (mediaType) {
            case 'image':
                mediaHtml = `<img src="${url}" alt="${title}" class="markdown-media-image" loading="lazy" />`;
                break;
            
            case 'video':
                mediaHtml = `
                    <video src="${url}" title="${title}" controls class="markdown-media-video" preload="metadata">
                        Your browser does not support the video tag. Please check "${title}".
                    </video>
                `;
                break;

            case 'audio':
                // Audio elements are wrapped for consistency, but the resize handles
                // may not be visually useful for this media type.
                mediaHtml = `
                    <audio src="${url}" title="${title}" controls class="markdown-media-audio" preload="metadata">
                        Your browser does not support the audio element. Please check "${title}".
                    </audio>
                `;
                break;
                
            default:
                mediaHtml = `<iframe src=${url} class="markdown-media-any" id="iframe_${title}"></iframe>`;
        }
        
        // Wrap the media element in the resizable container
        output += `
        <div class="markdown-media-wrapper option" style="${styleAttr}" data-type="${mediaType}" title="${title}">
                <a href=${url} target="_blank">
                ${title}↗️
                </a>
                ${mediaHtml}
            </div>
        `;

        return output;
    }
};