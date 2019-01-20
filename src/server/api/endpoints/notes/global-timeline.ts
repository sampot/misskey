import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/note';
import define from '../../define';
import { ILocalUser } from '../../../../models/user';
import { error } from '../../../../prelude/promise';
import fetchMeta from '../../../../misc/fetch-meta';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': 'グローバルタイムラインを取得します。'
	},

	params: {
		withFiles: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		sinceDate: {
			validator: $.num.optional
		},

		untilDate: {
			validator: $.num.optional
		},
	}
};

const fetchMutedUserIds = async (muter: ILocalUser) => muter ? await Mute.find({ muterId: muter._id })
	.then(x => x.map(x => x.muteeId)) : null;

export default define(meta, (ps, user) => fetchMeta()
.then(({ disableGlobalTimeline }) =>
	[ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate].filter(x => x).length > 1 ?
		error('only one of sinceId, untilId, sinceDate, untilDate can be specified') :
	disableGlobalTimeline && (!user || !user.isAdmin && !user.isModerator) ?
		error('global timeline disabled') :
		fetchMutedUserIds(user))
	.then($nin => Note.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			createdAt:
				ps.sinceDate ? { $gt: new Date(ps.sinceDate) } :
				ps.untilDate ? { $lt: new Date(ps.untilDate) } : undefined,
			deletedAt: null,
			visibility: 'public',
			replyId: null,
			userId: $nin && $nin.length ? { $nin } : undefined,
			['_reply.userId']: $nin && $nin.length ? { $nin } : undefined,
			['_renote.userId']: $nin && $nin.length ? { $nin } : undefined,
			fileIds: ps.withFiles ? { $exists: true, $ne: [] } : undefined
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId || ps.sinceDate ? 1 : -1 }
		}))
	.then(x => packMany(x, user)));
