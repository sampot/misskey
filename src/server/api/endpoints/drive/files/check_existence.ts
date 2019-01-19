import $ from 'cafy';
import DriveFile, { pack } from '../../../../../models/drive-file';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '与えられたMD5ハッシュ値を持つファイルがドライブに存在するかどうかを返します。',
		'en-US': 'Returns whether the file with the given MD5 hash exists in the user\'s drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

	params: {
		md5: {
			validator: $.str,
			desc: {
				'ja-JP': 'ファイルのMD5ハッシュ'
			}
		}
	}
};

export default define(meta, (ps, user) => DriveFile.findOne({
		md5: ps.md5,
		'metadata.userId': user._id,
		'metadata.deletedAt': { $exists: false }
	})
	.then(async x => ({
		file: x === null ? null : await pack(x, { self: true })
	})));
