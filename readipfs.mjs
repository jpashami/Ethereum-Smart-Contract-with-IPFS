// Reading from IPFS
import { create } from 'ipfs-http-client';
const client = create();
let resultContent = '';

export async function readIPFS139(_cid) {
    const resp = await client.cat(_cid);
    let content = [];
    for await (const chunk of resp) {
        content = [...content, ...chunk];
        const raw = Buffer.from(content).toString('utf8')
        resultContent = raw;
        // console.log(JSON.parse(raw))
        //console.log(raw)
    }
    // console.log(JSON.stringify(content));
    return resultContent;
}
