const {
    models: { Rating }
} = require('../../../../lib/models');

class RatingController {
    async listPage(req, res) {
        return res.render('ratings/list');
    }

    // async RestaurantlistPage(req, res) {
    //     return res.render('ratings/restaurantratinglist');
    // }

    async list(req, res) {
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            //isDeleted: false,
        };

        if (reqData.search.value) {
            const searchValue = new RegExp(
                reqData.search.value
                    .split(' ')
                    .filter(val => val)
                    .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
                    .join('|'),
                'i'
            );

            query.$or = [{ comment: searchValue }];
        }

        let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
        case 1:
            sortCond = {
                comment: sortOrder,
            };
            break;
        default:
            sortCond = { created: sortOrder };
            break;
        }

        const count = await Rating.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let ratings = await Rating.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit).populate({
                path: 'restaurantId',
              
                populate : {
                    path : 'restaurantId',
                    model: 'Restaurant'
              }
           
        }).populate({
            path:'userId',
            populate : {
                path : 'userId',
                model: 'User'
            }
        })

        if (ratings) {
            ratings = ratings.map(rating => {
                let actions = '';
                let rname;
                if(rating.restaurantId.name == null) {
                    rname = '-';
                }else {
                    rname = rating.restaurantId.name;
                }

                actions = `<a  href="/ratings/view/${rating._id}" ><i class="fas fa-eye"></i></a>`;
                if(rating.status){
                actions = `${actions}<a class="statusChange" href="/ratings/update-status?id=${rating._id}&status=false&" title="Activate"> <i class="fa fa-check"></i> </a>`;
                }else{
                    actions = `${actions}<a class="statusChange" href="/ratings/update-status?id=${rating._id}&status=true&" title="Inactivate"> <i class="fa fa-ban"></i> </a>`;
                }
                if(rating.isDeleted){
                    actions = `${actions}<a class="deleteItem" href="/ratings/delete-restore/${rating._id}" title="Restore"><i class="fas fa-trash-restore"></i></a>`;
                }else{
                    actions = `${actions}<a class="deleteItem" href="/ratings/delete/${rating._id}" title="Delete"><i class="fa fa-trash"></i></a>`;
                }

                return {
                    0: (skip += 1),
                    1: rating.starrating,
                    2: rating.userId?rating.userIdemail:'',
                    3: rname,
                    4: rating.comment,
                    5: rating.status?'<span class="badge label-table badge-success">Active</span>' : '<span class="badge label-table badge-secondary">In-Active</span>' ,
                    6: rating.isDeleted?'<span class="badge label-table badge-success">yes</span>' : '<span class="badge label-table badge-secondary">No</span>' ,
                    7: actions ? actions : '<span class="badge label-table badge-secondary">N/A</span>',
                };
            });
        }

       
        response.data = ratings;
        return res.send(response);
    } 

    async delete(req, res) {
        const rating = await Rating.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!rating) {
            req.flash('error', "Rating does not exists!!");
            return res.redirect('/ratings');
        }

        rating.isDeleted = true;
        await rating.save();

        req.flash('success', "Rating has been deleted successfully");
        return res.redirect('/ratings');
    }

    async updateStatus(req, res) {
        const {id, status} = req.query;
        let rating = await Rating.findOne({
            _id: id,
            
        });

        if (!rating) {
            req.flash('error', "Rating does not exists!!");
            return res.redirect('/users');
        }

        rating.status = status;
        await rating.save();

        req.flash('success', "Rating status has been updated successfully");
        return res.redirect('/ratings');
    }

    async deleteRestore(req, res) {
        const rating= await Rating.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!rating) {
            req.flash('error', "Rating does not exists!!");
            return res.redirect('/ratings');
        }
        rating.isDeleted = false;
        await rating.save();

        req.flash('success', 'Rating is Restore Successfully ');
        return res.redirect('/ratings');
    }

    async view(req, res) {
        const id = req.params.id;
        let ratings = await Rating.find({_id:id}).populate({
            path: 'restaurantId',
          
            populate : {
                path : 'restaurantId',
                model: 'Restaurant'
          }
       
        }).populate({
            path:'userId',
            
                    populate : {
                        path : 'userId',
                        model: 'User'
                    }
        })

        //console.log("--------"+ratings[0].userId.firstname+"------")
        if(ratings.length>0){
        return res.render("ratings/view", {ratings:ratings[0]});
        }
    }
}

module.exports = new RatingController();